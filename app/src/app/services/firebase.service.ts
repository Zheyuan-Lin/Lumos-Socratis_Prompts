import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';

@Injectable({
  providedIn: 'root'
})
export class FirebaseService {
  // Use your server endpoint instead of Firebase directly
  private apiUrl = 'https://firestore.googleapis.com/v1/projects/socratisprompts/databases/(default)/documents';
  private apiKey = 'AIzaSyDPwM7yvXoLBYGL2JQg_U1LJ7XDkNEZUVY';

  constructor(private http: HttpClient) {}

  async storeResponse(response: string): Promise<any> {
    try {
      const data = {
        text: response,
        timestamp: new Date().toISOString()
      };

      const headers = new HttpHeaders({
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${this.apiKey}`
      });

      const result = await this.http.post(
        `${this.apiUrl}/responses?key=${this.apiKey}`, 
        data,
        { headers }
      ).toPromise();
      
      return result;
    } catch (e) {
      console.error("Error storing response:", e);
      throw e;
    }
  }
}