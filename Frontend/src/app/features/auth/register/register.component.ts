import { Component } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { AuthService } from '../../../core/services/auth.service';
import { Usuario } from '../../../shared/models/usuario.model';
import { NgIf } from '@angular/common';

@Component({
  selector: 'app-register',
  imports: [NgIf, ReactiveFormsModule],
  standalone: true,
  templateUrl: './register.component.html',
  styleUrls: ['./register.component.css']
})
export class RegisterComponent {
  registerForm: FormGroup;
  loading = false;
  error: string | null = null;

  constructor(private fb: FormBuilder, private authService: AuthService) {
    this.registerForm = this.fb.group({
      nombre: ['', Validators.required],
      email: ['', [Validators.required, Validators.email]],
      password: ['', Validators.required]
    });
  }

  onSubmit(): void {
    if (this.registerForm.invalid) return;

    this.loading = true;
    this.error = null;

    const { nombre, email, password } = this.registerForm.value;

    const usuario: Usuario = {
      id: '', // se asignará por Firebase
      nombre,
      email,
      fechaCreacion: new Date(),
      apellido: '',
      rol: '',
      activo: false
    };

    this.authService.register(usuario, password).subscribe({
      next: () => {
        this.loading = false;
        // Redirigir o mostrar éxito
      },
      error: (err) => {
        this.error = err.message;
        this.loading = false;
      }
    });
  }
}
