import { Routes } from '@angular/router';
import { LoginComponent } from './login/login.component';
import { RegisterComponent } from './register/register.component';
import { EmailDashboardComponent } from './email-dashboard/email-dashboard.component';
import { KanbanBoardComponent } from './kanban-board/kanban-board.component';

export const routes: Routes = [
  { path: '', redirectTo: '/dashboard', pathMatch: 'full' },
  { path: 'login', component: LoginComponent },
  { path: 'registro', component: RegisterComponent },
  { path: 'dashboard', component: EmailDashboardComponent },
  { path: 'kanban', component: KanbanBoardComponent }
];
