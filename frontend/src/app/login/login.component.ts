import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { ApiService } from '../services/api.service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, RouterLink, FormsModule],
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.css']
})
export class LoginComponent {
  loginData = {
    username: '',  // Cambiado de email a username para coincidir con el backend
    password: ''
  };

  errorMessage: string | null = null;
  isLoading = false;

  constructor(
    private apiService: ApiService,
    private router: Router
  ) {}

  onSubmit() {
    if (!this.loginData.username || !this.loginData.password) {
      this.errorMessage = 'Por favor completa todos los campos';
      return;
    }

    this.isLoading = true;
    this.errorMessage = null;

    this.apiService.login({
      username: this.loginData.username,
      password: this.loginData.password
    }).subscribe({
      next: (response: any) => {
        // Guarda el token en localStorage
        localStorage.setItem('access_token', response.access_token);
        // Redirige al dashboard o página principal
        this.router.navigate(['/dashboard']);
      },
      error: (err) => {
        this.isLoading = false;
        this.errorMessage = err.error?.detail || 'Error al iniciar sesión';
      }
    });
  }
}