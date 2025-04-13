import { Component, OnInit } from '@angular/core';
import { Router, ActivatedRoute } from '@angular/router';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ChatService } from '../services/socket.service';

@Component({
  selector: 'app-post-page',
  template: `
    <div class="presurvey-container">
      <div class="redirect-message">
        <h2>Post-Survey</h2>
        <p>You will now be redirected to our research survey.</p>
        <p>After completing the survey, you will be automatically returned to this application.</p>
        <div class="participant-id">
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
        <div class="button-container">
          <button class="survey-button" (click)="redirectToSurvey()">
            <i class="fa fa-external-link"></i> Start Survey
          </button>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .presurvey-container {
      display: flex;
      justify-content: center;
      align-items: center;
      min-height: 100vh;
      background-color: #f8f9fa;
      padding: 20px;
    }

    .redirect-message {
      background: white;
      padding: 40px;
      border-radius: 10px;
      box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
      text-align: center;
      max-width: 600px;
      width: 100%;
    }

    h2 {
      color: #2c3e50;
      margin-bottom: 20px;
      font-weight: 600;
    }

    p {
      color: #5a6c7d;
      font-size: 16px;
      line-height: 1.6;
      margin-bottom: 10px;
    }

    .participant-id {
      margin: 20px 0;
      padding: 15px;
      background-color: #e9ecef;
      border-radius: 6px;
    }

    .id-container {
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 10px;
      margin: 10px 0;
    }

    .participant-id strong {
      color: #0d6efd;
      font-size: 18px;
      letter-spacing: 1px;
      padding: 8px 12px;
      background-color: white;
      border-radius: 4px;
      border: 1px solid #dee2e6;
    }

    .copy-button {
      display: inline-flex;
      align-items: center;
      gap: 6px;
      padding: 8px 12px;
      border: 1px solid #dee2e6;
      border-radius: 4px;
      background-color: white;
      color: #495057;
      font-size: 14px;
      cursor: pointer;
      transition: all 0.2s ease;
    }

    .copy-button:hover {
      background-color: #f8f9fa;
      border-color: #0d6efd;
      color: #0d6efd;
    }

    .copy-button.copied {
      background-color: #198754;
      border-color: #198754;
      color: white;
    }

    .copy-button i {
      font-size: 14px;
    }

    .id-note {
      font-size: 14px;
      color: #6c757d;
      margin-top: 5px;
    }

    .button-container {
      margin-top: 30px;
    }

    .survey-button {
      background-color: #0d6efd;
      color: white;
      border: none;
      padding: 12px 24px;
      border-radius: 6px;
      font-size: 16px;
      font-weight: 500;
      cursor: pointer;
      transition: all 0.2s ease;
      display: inline-flex;
      align-items: center;
      gap: 8px;
    }

    .survey-button:hover {
      background-color: #0b5ed7;
      transform: translateY(-1px);
      box-shadow: 0 4px 12px rgba(13, 110, 253, 0.2);
    }

    .survey-button i {
      font-size: 14px;
    }
  `]
})
export class PostPageComponent implements OnInit {
  userId: string;
  showCopied: boolean = false;

  constructor(
    private router: Router,
    private route: ActivatedRoute,
    private chatService: ChatService
  ) {}

  ngOnInit(): void {
    // Get userId from URL params or localStorage
    this.route.queryParams.subscribe(params => {
      this.userId = params['userId'] || localStorage.getItem('userId');
    });
    
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

  redirectToSurvey(): void {
    const surveyUrl = 'https://qfreeaccountssjc1.az1.qualtrics.com/jfe/form/SV_bjcPehy9IOhUTNI';
    const returnUrl = encodeURIComponent(
      `${window.location.origin}${window.location.pathname}?survey_completed=true&userId=${this.userId}`
    );
    window.location.href = `${surveyUrl}?return_url=${returnUrl}&userId=${this.userId}`;
  }
} 