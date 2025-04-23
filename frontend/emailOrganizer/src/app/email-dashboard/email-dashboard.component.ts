import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';

interface Email {
  subject: string;
  sender: string;
  isRead: boolean;
  id: number;
}

@Component({
  selector: 'app-email-dashboard',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './email-dashboard.component.html',
  styleUrls: ['./email-dashboard.component.css']
})
export class EmailDashboardComponent {
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
