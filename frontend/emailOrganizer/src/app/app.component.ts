import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterOutlet } from '@angular/router';

interface Email {
  subject: string;
  sender: string;
  isRead: boolean;
  id: number;
}

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [CommonModule, RouterOutlet],
  templateUrl: './app.component.html',
  styleUrl: './app.component.css'
})
export class AppComponent {
  title = 'emailOrganizer';

  emails: Email[] = [
    {
      id: 1,
      subject: 'Oferta de trabajo en TechCorp',
      sender: 'recruiter@techcorp.com',
      isRead: false
    },
    {
      id: 2,
      subject: 'Resumen mensual de tu cuenta',
      sender: 'notificaciones@banco.com',
      isRead: false
    },
    {
      id: 3,
      subject: '¡Últimos descuentos!',
      sender: 'promos@tienda.com',
      isRead: false
    }
  ];

  classifiedEmails: number = 0;

  classifyEmail(id: number): void {
    const email = this.emails.find(e => e.id === id);
    if (email && !email.isRead) {
      email.isRead = true;
      this.classifiedEmails++;
    }
  }

  cleanInbox(): void {
    this.emails = [];
    this.classifiedEmails = 0;
  }
}
