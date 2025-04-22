import { Component, OnInit } from '@angular/core';
import { Router, ActivatedRoute } from '@angular/router';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { DomSanitizer, SafeUrl } from '@angular/platform-browser';

@Component({
  selector: 'app-post-page',
  template: `
    <div class="post-survey-container">
      <div class="header">
        <h1>Post-Survey</h1>
        <div class="participant-info">
          <span class="participant-label">Participant ID:</span>
          <span class="participant-id">{{userId}}</span>
          <button class="copy-id-btn" (click)="copyUserId()" [class.copied]="showCopied" title="Copy ID">
            <i class="fa" [class.fa-check]="showCopied" [class.fa-copy]="!showCopied"></i>
          </button>
        </div>
      </div>

      <div class="survey-instructions">
        <p>Please click the button below to proceed to the post-study survey. You will need your Participant ID for the survey.</p>
        <p class="id-reminder">Your Participant ID: <strong>{{userId}}</strong></p>
        <button class="proceed-btn" (click)="proceedToSurvey()">
          Proceed to Survey
          <i class="fa fa-external-link"></i>
        </button>
      </div>
    </div>
  `,
  styles: [`
    .post-survey-container {
      max-width: 800px;
      margin: 40px auto;
      padding: 20px;
    }

    .header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 30px;
    }

    .participant-info {
      display: flex;
      align-items: center;
      gap: 8px;
      padding: 4px 12px;
      background-color: #f8f9fa;
      border-radius: 6px;
      border: 1px solid #dee2e6;
    }

    .participant-label {
      color: #6c757d;
      font-size: 14px;
    }

    .participant-id {
      color: #0d6efd;
      font-weight: 500;
      font-size: 15px;
      letter-spacing: 0.5px;
    }

    .copy-id-btn {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      width: 28px;
      height: 28px;
      border: 1px solid #dee2e6;
      border-radius: 4px;
      background-color: white;
      color: #495057;
      cursor: pointer;
      transition: all 0.2s ease;
      padding: 0;
    }

    .copy-id-btn:hover {
      background-color: #f8f9fa;
      border-color: #0d6efd;
      color: #0d6efd;
    }

    .copy-id-btn.copied {
      background-color: #198754;
      border-color: #198754;
      color: white;
    }

    .survey-instructions {
      text-align: center;
      padding: 40px;
      background-color: #f8f9fa;
      border-radius: 8px;
      margin-top: 20px;
    }

    .survey-instructions p {
      font-size: 16px;
      color: #495057;
      margin-bottom: 20px;
    }

    .id-reminder {
      background-color: white;
      padding: 15px;
      border-radius: 6px;
      border: 1px solid #dee2e6;
      margin: 20px 0;
    }

    .id-reminder strong {
      color: #0d6efd;
      font-size: 18px;
      letter-spacing: 0.5px;
    }

    .proceed-btn {
      background-color: #0d6efd;
      color: white;
      border: none;
      padding: 15px 30px;
      border-radius: 6px;
      font-size: 16px;
      cursor: pointer;
      transition: all 0.2s ease;
      display: inline-flex;
      align-items: center;
      gap: 10px;
    }

    .proceed-btn:hover {
      background-color: #0b5ed7;
      transform: translateY(-1px);
    }

    .proceed-btn i {
      font-size: 14px;
    }

    h1 {
      margin: 0;
      color: #2c3e50;
    }
  `]
})
export class PostPageComponent implements OnInit {
  userId: string;
  showCopied: boolean = false;
  private qualtricsUrl = 'https://qfreeaccountssjc1.az1.qualtrics.com/jfe/form/SV_bjcPehy9IOhUTNI';

  constructor(
    private router: Router,
    private route: ActivatedRoute,
    private sanitizer: DomSanitizer
  ) {}

  ngOnInit(): void {
    // Get userId from URL params or localStorage
    this.route.queryParams.subscribe(params => {
      this.userId = params['userId'] || localStorage.getItem('userId');
    });
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

  proceedToSurvey(): void {
    // Construct URL with userId parameter
    const surveyUrl = `${this.qualtricsUrl}?userId=${this.userId}`;
    // Open in the same window
    window.location.href = surveyUrl;
  }
} 