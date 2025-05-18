import { NgIf } from '@angular/common';
import { Component } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';

@Component({
    selector: 'app-login',
    imports: [NgIf, ReactiveFormsModule],
    templateUrl: './login.component.html'
})
export class LoginComponent {
    loginForm: FormGroup;
    loading = false;
    error: string | null = null;
    authService: any;
    form: any;
    router: any;

    constructor(private fb: FormBuilder) {
        this.loginForm = this.fb.group({
            email: ['', [Validators.required, Validators.email]],
            password: ['', Validators.required]
        });
    }

onSubmit(): void {
    if (this.form.invalid) return;

    this.loading = true;
    this.error = null;

    const { email, password } = this.form.value;

    this.authService.login(email!, password!).subscribe({
      next: () => {
        this.router.navigateByUrl('/');
      },
      error: (err: { message: string | null; }) => {
        this.error = err.message;
        this.loading = false;
      }
    });
  }
}