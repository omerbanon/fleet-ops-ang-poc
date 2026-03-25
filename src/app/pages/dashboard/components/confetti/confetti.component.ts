import { Component, OnInit, signal } from '@angular/core';

interface Particle {
  id: number;
  left: number;
  color: string;
  delay: number;
  duration: number;
  size: number;
}

const COLORS = ['#10B981', '#3B82F6', '#F59E0B', '#EF4444', '#8B5CF6', '#EC4899'];

@Component({
  selector: 'app-confetti',
  standalone: true,
  templateUrl: './confetti.component.html',
  styleUrl: './confetti.component.scss',
})
export class ConfettiComponent implements OnInit {
  particles = signal<Particle[]>([]);

  ngOnInit(): void {
    const items: Particle[] = [];
    for (let i = 0; i < 50; i++) {
      items.push({
        id: i,
        left: Math.random() * 100,
        color: COLORS[Math.floor(Math.random() * COLORS.length)],
        delay: Math.random() * 1.5,
        duration: 2 + Math.random() * 2,
        size: 6 + Math.random() * 6,
      });
    }
    this.particles.set(items);
  }
}
