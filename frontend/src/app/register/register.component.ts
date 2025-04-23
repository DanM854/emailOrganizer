import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink, Router } from '@angular/router';
import { FormsModule, NgForm } from '@angular/forms';
import { ApiService } from '../services/api.service';

@Component({
  selector: 'app-register',
  standalone: true,
  imports: [CommonModule, RouterLink, FormsModule],
  templateUrl: './register.component.html',
  styleUrls: ['./register.component.css']
})
export class RegisterComponent {
  registerData = {
    username: '',
    password: '',
    confirmPassword: ''
  };

  errorMessage: string | null = null;
  isLoading = false;

  constructor(
    private apiService: ApiService,
    private router: Router
  ) {}

  onSubmit(form: NgForm) {
    // Validación básica
    if (this.registerData.password !== this.registerData.confirmPassword) {
      this.errorMessage = 'Las contraseñas no coinciden';
      return;
    }

    if (form.invalid) {
      this.errorMessage = 'Por favor, completa todos los campos correctamente.';
      return;
    }

    this.isLoading = true;
    this.errorMessage = null;

    this.apiService.register({
      username: this.registerData.username,
      password: this.registerData.password
    }).subscribe({
      next: () => {
        this.router.navigate(['/login'], {
          queryParams: { registered: 'true' } // Opcional: para mostrar mensaje de éxito en login
        });
      },
      error: (err) => {
        this.isLoading = false;
        this.errorMessage = err.error?.detail || 'Ocurrió un error al registrarse.';
      }
    });
  }
}