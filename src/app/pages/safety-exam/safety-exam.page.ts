import { Component, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { IonContent } from '@ionic/angular/standalone';

import { SafetyExamService } from '../../services/safety-exam.service';
import { EXAM_SECTIONS } from '../../mock/mock-safety-exam';
import type { SafetyExamPayload } from '../../models/safety-exam.model';

@Component({
  selector: 'app-safety-exam',
  standalone: true,
  imports: [FormsModule, IonContent],
  templateUrl: './safety-exam.page.html',
  styleUrl: './safety-exam.page.scss',
})
export class SafetyExamPage {
  private examService = inject(SafetyExamService);

  sections = EXAM_SECTIONS;

  // Personal details (matches React state shape)
  fullName = signal('');
  email = signal('');
  militaryId = signal('');
  rank = signal('');

  // Answers map: questionId → optionKey
  answers = signal<Record<string, string>>({});

  submitting = signal(false);
  submitted = signal(false);
  errorMessage = signal('');

  totalQuestions = computed(() =>
    this.sections.reduce((sum, s) => sum + s.questions.length, 0),
  );

  answeredCount = computed(() => Object.keys(this.answers()).length);

  setAnswer(questionId: string, optionKey: string): void {
    this.answers.update(a => ({ ...a, [questionId]: optionKey }));
  }

  isSelected(questionId: string, optionKey: string): boolean {
    return this.answers()[questionId] === optionKey;
  }

  onSubmit(): void {
    this.errorMessage.set('');

    if (!this.fullName().trim() || !this.email().trim()) {
      this.errorMessage.set('נא למלא שם מלא ואימייל.');
      return;
    }

    const answered = this.answeredCount();
    const total = this.totalQuestions();
    if (answered < total) {
      this.errorMessage.set(`נא לענות על כל השאלות (ענית על ${answered} מתוך ${total}).`);
      return;
    }

    this.submitting.set(true);
    const payload: SafetyExamPayload = {
      fullName: this.fullName().trim(),
      email: this.email().trim(),
      militaryId: this.militaryId().trim(),
      rank: this.rank().trim(),
      answers: this.answers(),
      totalQuestions: total,
    };

    this.examService.submit(payload).subscribe({
      next: result => {
        this.submitting.set(false);
        if (result.ok) {
          this.submitted.set(true);
          if (typeof window !== 'undefined') {
            window.scrollTo({ top: 0, behavior: 'smooth' });
          }
        } else {
          this.errorMessage.set(result.error || 'שגיאה בשליחת הטופס');
        }
      },
      error: err => {
        this.submitting.set(false);
        this.errorMessage.set(err instanceof Error ? err.message : 'שגיאה בשליחת הטופס');
      },
    });
  }
}
