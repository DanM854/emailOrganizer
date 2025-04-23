import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { environment } from '../../environments/environment';
import { Observable } from 'rxjs';

interface EmailItem {
  id: number;
  subject: string;
  sender: string;
  content: string;
  status: 'pending' | 'reviewed' | 'replied' | 'completed';
  date: string;
}

@Injectable({
  providedIn: 'root'
})
export class ApiService {
  constructor(private http: HttpClient) { }

  private getAuthHeaders(): HttpHeaders {
    const token = localStorage.getItem('access_token');
    return new HttpHeaders({
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    });
  }

  // Auth Methods
  register(userData: { username: string; password: string }): Observable<any> {
    return this.http.post(
      `${environment.apiUrl}/register`,
      userData,
      { headers: new HttpHeaders({ 'Content-Type': 'application/json' }) }
    );
  }

  login(credentials: { username: string; password: string }): Observable<{ access_token: string, token_type: string }> {
    const body = new URLSearchParams();
    body.set('username', credentials.username);
    body.set('password', credentials.password);

    return this.http.post<{ access_token: string, token_type: string }>(
      `${environment.apiUrl}/login`,
      body.toString(),
      { headers: new HttpHeaders({ 'Content-Type': 'application/x-www-form-urlencoded' }) }
    );
  }

  logout(): void {
    localStorage.removeItem('access_token');
  }

  isAuthenticated(): boolean {
    return !!localStorage.getItem('access_token');
  }

  // Email/Kanban Methods
  getEmails(): Observable<EmailItem[]> {
    return this.http.get<EmailItem[]>(
      `${environment.apiUrl}/api/messages/history`,
      { headers: this.getAuthHeaders() }
    );
  }

  updateEmailStatus(emailId: number, status: string): Observable<any> {
    return this.http.patch(
      `${environment.apiUrl}/api/messages/${emailId}`,
      { status },
      { headers: this.getAuthHeaders() }
    );
  }

  // Categories Methods
  getEmailsByCategory(category: string): Observable<EmailItem[]> {
    return this.http.get<EmailItem[]>(
      `${environment.apiUrl}/api/messages/category?category=${category}`,
      { headers: this.getAuthHeaders() }
    );
  }

  // Admin Methods (opcional)
  getUsers(adminKey: string): Observable<any> {
    return this.http.get(
      `${environment.apiUrl}/admin/users?admin_key=${adminKey}`,
      { headers: this.getAuthHeaders() }
    );
  }
}