import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';

interface EmailItem {
  id: number;
  subject: string;
  sender: string;
  content: string;
  status: 'pending' | 'reviewed' | 'replied' | 'completed';
  date: Date;
}

@Component({
  selector: 'app-kanban-board',
  standalone: true,
  imports: [CommonModule, RouterLink, FormsModule],
  templateUrl: './kanban-board.component.html',
  styleUrls: ['./kanban-board.component.css']
})
export class KanbanBoardComponent {
  emails: EmailItem[] = [
    {
      id: 1,
      subject: 'Oferta de trabajo en TechCorp',
      sender: 'recruiter@techcorp.com',
      content: 'Estamos interesados en tu perfil para una posición en nuestra empresa...',
      status: 'pending',
      date: new Date(2025, 3, 7)
    },
    {
      id: 2,
      subject: 'Resumen mensual de tu cuenta',
      sender: 'notificaciones@banco.com',
      content: 'Aquí está el resumen mensual de tu cuenta bancaria...',
      status: 'pending',
      date: new Date(2025, 3, 8)
    },
    {
      id: 3,
      subject: '¡Últimos descuentos!',
      sender: 'promos@tienda.com',
      content: 'No te pierdas nuestras ofertas especiales de temporada...',
      status: 'reviewed',
      date: new Date(2025, 3, 6)
    },
    {
      id: 4,
      subject: 'Actualización de proyecto',
      sender: 'manager@company.com',
      content: 'Te comparto la última actualización del proyecto en curso...',
      status: 'replied',
      date: new Date(2025, 3, 5)
    },
    {
      id: 5,
      subject: 'Confirmación de reserva',
      sender: 'reservas@hotel.com',
      content: 'Su reserva ha sido confirmada para las fechas solicitadas...',
      status: 'completed',
      date: new Date(2025, 3, 3)
    },
    {
      id: 6,
      subject: 'Invitación a evento',
      sender: 'eventos@conferencia.org',
      content: 'Te invitamos a participar en nuestro próximo evento...',
      status: 'reviewed',
      date: new Date(2025, 3, 4)
    }
  ];

  changeEmailStatus(email: EmailItem, newStatus: 'pending' | 'reviewed' | 'replied' | 'completed'): void {
    email.status = newStatus;
  }

  getPendingEmails(): EmailItem[] {
    return this.emails.filter(email => email.status === 'pending');
  }

  getReviewedEmails(): EmailItem[] {
    return this.emails.filter(email => email.status === 'reviewed');
  }

  getRepliedEmails(): EmailItem[] {
    return this.emails.filter(email => email.status === 'replied');
  }

  getCompletedEmails(): EmailItem[] {
    return this.emails.filter(email => email.status === 'completed');
  }

  // Método para manejar el drag and drop
  onDragStart(event: DragEvent, email: EmailItem): void {
    if (event.dataTransfer) {
      event.dataTransfer.setData('text/plain', email.id.toString());
    }
  }

  onDragOver(event: DragEvent): void {
    event.preventDefault();
  }

  onDrop(event: DragEvent, status: 'pending' | 'reviewed' | 'replied' | 'completed'): void {
    event.preventDefault();
    if (event.dataTransfer) {
      const emailId = parseInt(event.dataTransfer.getData('text/plain'), 10);
      const email = this.emails.find(e => e.id === emailId);
      if (email) {
        email.status = status;
      }
    }
  }
}
