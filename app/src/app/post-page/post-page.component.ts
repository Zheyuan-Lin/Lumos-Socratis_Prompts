import { Component, OnInit } from '@angular/core';
import { Router, ActivatedRoute } from '@angular/router';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';

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

      <form [formGroup]="surveyForm" (ngSubmit)="onSubmit()">
        <div class="form-group">
          <label>How would you rate the usability of the visualization?</label>
          <div class="rating-input">
            <input type="number" formControlName="usabilityRating" min="1" max="5" required>
            <span class="rating-hint">(1-5, where 5 is best)</span>
          </div>
        </div>

        <div class="form-group">
          <label>How clear were the visualizations in presenting the data?</label>
          <div class="rating-input">
            <input type="number" formControlName="clarityRating" min="1" max="5" required>
            <span class="rating-hint">(1-5, where 5 is clearest)</span>
          </div>
        </div>

        <div class="form-group">
          <label>How helpful was the tool in understanding the data?</label>
          <div class="rating-input">
            <input type="number" formControlName="helpfulnessRating" min="1" max="5" required>
            <span class="rating-hint">(1-5, where 5 is most helpful)</span>
          </div>
        </div>

        <div class="form-group">
          <label>Additional Comments:</label>
          <textarea 
            formControlName="comments" 
            rows="4" 
            placeholder="Please share any additional thoughts or feedback...">
          </textarea>
        </div>

        <button type="submit" [disabled]="!surveyForm.valid">Submit Survey</button>
      </form>
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

    h1 {
      margin: 0;
      color: #2c3e50;
    }

    .form-group {
      margin-bottom: 24px;
    }

    label {
      display: block;
      margin-bottom: 8px;
      font-weight: 500;
      color: #2c3e50;
    }

    .rating-input {
      display: flex;
      align-items: center;
      gap: 10px;
    }

    input[type="number"] {
      width: 80px;
      padding: 8px;
      border: 1px solid #dee2e6;
      border-radius: 4px;
    }

    .rating-hint {
      color: #6c757d;
      font-size: 14px;
    }

    textarea {
      width: 100%;
      padding: 12px;
      border: 1px solid #dee2e6;
      border-radius: 4px;
      resize: vertical;
    }

    button[type="submit"] {
      background-color: #0d6efd;
      color: white;
      border: none;
      padding: 12px 24px;
      border-radius: 6px;
      font-size: 16px;
      cursor: pointer;
      transition: all 0.2s ease;
    }

    button[type="submit"]:hover {
      background-color: #0b5ed7;
      transform: translateY(-1px);
    }

    button[type="submit"]:disabled {
      background-color: #e9ecef;
      color: #6c757d;
      cursor: not-allowed;
      transform: none;
    }
  `]
})
export class PostPageComponent implements OnInit {
  surveyForm: FormGroup;
  userId: string;
  showCopied: boolean = false;

  constructor(
    private fb: FormBuilder,
    private router: Router,
    private route: ActivatedRoute
  ) {
    this.surveyForm = this.fb.group({
      usabilityRating: ['', [Validators.required, Validators.min(1), Validators.max(5)]],
      clarityRating: ['', [Validators.required, Validators.min(1), Validators.max(5)]],
      helpfulnessRating: ['', [Validators.required, Validators.min(1), Validators.max(5)]],
      comments: ['']
    });
  }

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

  onSubmit(): void {
    if (this.surveyForm.valid) {
      const surveyData = {
        ...this.surveyForm.value,
        userId: this.userId,
        timestamp: new Date().toISOString()
      };
      console.log('Survey submitted:', surveyData);
      // Here you would typically send the data to your backend
      // After successful submission, you can redirect or show a completion message
    }
  }
} 