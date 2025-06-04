import { Component, OnInit } from '@angular/core';
import { Router, ActivatedRoute } from '@angular/router';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ChatService } from '../services/socket.service';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';

@Component({
  selector: 'app-post-page',
  template: `
    <div class="presurvey-container">
      <div class="content-wrapper">
        <div class="survey-section">
          <div class="header">
            <h2>Post-Survey</h2>
            <div class="participant-id" *ngIf="userId">
              <p>Your Participant ID:</p>
              <div class="id-container">
                <strong>{{userId}}</strong>
                <button class="copy-button" (click)="copyUserId()" [class.copied]="showCopied">
                  <i class="fa" [class.fa-check]="showCopied" [class.fa-copy]="!showCopied"></i>
                  {{showCopied ? 'Copied!' : 'Copy ID'}}
                </button>
              </div>
              <p class="id-note">Please copy this ID and paste it into the survey.</p>
            </div>
            <div class="error-message" *ngIf="!userId">
              <p>No participant ID found. Please return to the main page.</p>
            </div>
          </div>
          <div class="survey-frame">
            <iframe 
              [src]="surveyUrl" 
              frameborder="0"
              (load)="onIframeLoad($event)">
            </iframe>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .presurvey-container {
      min-height: 100vh;
      background-color: #f5f7fa;
      padding: 20px;
    }

    .content-wrapper {
      max-width: 1200px;
      margin: 0 auto;
      display: grid;
      grid-template-columns: 1fr;
      gap: 20px;
      height: calc(100vh - 40px);
    }

    .survey-section {
      background: white;
      border-radius: 12px;
      box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
      display: flex;
      flex-direction: column;
      overflow: hidden;
    }

    .header {
      padding: 20px;
      border-bottom: 1px solid #edf2f7;
    }

    h2 {
      color: #2d3748;
      margin: 0 0 20px 0;
      font-size: 24px;
      font-weight: 600;
    }

    .participant-id {
      background-color: #f8fafc;
      padding: 15px;
      border-radius: 8px;
    }

    .id-container {
      display: flex;
      align-items: center;
      gap: 10px;
      margin: 10px 0;
    }

    .participant-id strong {
      color: #3182ce;
      font-size: 18px;
      padding: 8px 12px;
      background-color: white;
      border-radius: 6px;
      border: 1px solid #e2e8f0;
    }

    .copy-button {
      display: inline-flex;
      align-items: center;
      gap: 6px;
      padding: 8px 12px;
      border: 1px solid #e2e8f0;
      border-radius: 6px;
      background-color: white;
      color: #4a5568;
      font-size: 14px;
      cursor: pointer;
      transition: all 0.2s ease;
    }

    .copy-button:hover {
      background-color: #f7fafc;
      border-color: #3182ce;
      color: #3182ce;
    }

    .copy-button.copied {
      background-color: #48bb78;
      border-color: #48bb78;
      color: white;
    }

    .id-note {
      color: #718096;
      font-size: 14px;
      margin: 5px 0 0 0;
    }

    .error-message {
      background-color: #fff5f5;
      border: 1px solid #feb2b2;
      color: #c53030;
      padding: 15px;
      border-radius: 8px;
      margin-top: 10px;
    }

    .error-message p {
      margin: 0;
      font-size: 14px;
    }

    .survey-frame {
      flex: 1;
      overflow: hidden;
    }

    .survey-frame iframe {
      width: 100%;
      height: 100%;
      border: none;
    }

    @media (max-width: 1024px) {
      .content-wrapper {
        height: auto;
      }

      .survey-section {
        height: 70vh;
      }
    }
  `]
})
export class PostPageComponent implements OnInit {
  private readonly SURVEY_URL = 'https://qfreeaccountssjc1.az1.qualtrics.com/jfe/form/SV_bjcPehy9IOhUTNI';
  
  userId: string | null = null;
  showCopied: boolean = false;
  surveyUrl: SafeResourceUrl;

  constructor(
    private router: Router,
    private route: ActivatedRoute,
    private chatService: ChatService,
    private sanitizer: DomSanitizer
  ) {
    this.surveyUrl = this.sanitizer.bypassSecurityTrustResourceUrl(this.SURVEY_URL);
    this.userId = localStorage.getItem('userId');
  }

  ngOnInit(): void {

    
    // Ensure socket connection is established
    this.chatService.connectToSocket();
  }

  copyUserId(): void {
    if (this.userId) {
      navigator.clipboard.writeText(this.userId).then(() => {
        this.showCopied = true;
        setTimeout(() => {
          this.showCopied = false;
        }, 2000);
      });
    }
  }

  onIframeLoad(event: Event): void {
    // Handle iframe load event if needed
  }
} 