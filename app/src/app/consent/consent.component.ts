import { Component } from '@angular/core';
import { Router } from '@angular/router';

@Component({
  selector: 'app-consent',
  template: `
    <div class="consent-container">
      <h1>Consent Form</h1>
      <div class="consent-content">
        <p>Thank you for participating in our study. Please read the following consent form carefully:</p>
        <div class="consent-text">
          <p>You are being asked to be in a research study. This form is designed to tell you everything you need to think about before you decide to consent (agree) to be in the study or not to be in the study. It is entirely your choice. If you decide to take part, you can change your mind later on and withdraw from the research study. You can skip any questions that you do not wish to answer.</p>
          
          <h3>Before making your decision:</h3>
          <ul>
            <li>Please carefully read this form or have it read to you</li>
            <li>Please ask questions about anything that is not clear</li>
          </ul>

          <h3>Study Overview</h3>
          <p>The purpose of this study is to observe decisions that subjects make using data presented in a visualization interface.</p>

          <h3>Procedures</h3>
          <p>In this study, you will be asked to:</p>
          <ul>
            <li>Complete a pre-survey</li>
            <li>Interact with data visualizations</li>
            <li>Answer questions about the visualizations</li>
            <li>Complete a post-survey</li>
          </ul>

          <h3>Risks and Benefits</h3>
          <p>We do not anticipate any risks greater than those involved in daily activities such as using a computer. This study is designed to learn more about how people interact with data visualizations.</p>

          <h3>Confidentiality</h3>
          <p>Your responses will be kept confidential and will only be used for research purposes. Your personal information will not be shared with any third parties.</p>
        </div>

        <div class="consent-checkbox">
          <input type="checkbox" [(ngModel)]="accepted" id="consent-checkbox">
          <label for="consent-checkbox">I have read and agree to the terms of this study</label>
        </div>

        <button [disabled]="!accepted" (click)="onContinue()" class="continue-button">Continue</button>
      </div>
    </div>
  `,
  styles: [`
    .consent-container {
      max-width: 800px;
      margin: 0 auto;
      padding: 20px;
      font-family: Arial, sans-serif;
    }
    .consent-content {
      margin-top: 20px;
      background-color: #fff;
      padding: 20px;
      border-radius: 8px;
      box-shadow: 0 2px 4px rgba(0,0,0,0.1);
    }
    .consent-text {
      margin: 20px 0;
      line-height: 1.6;
    }
    .consent-text h3 {
      color: #333;
      margin-top: 20px;
    }
    .consent-checkbox {
      margin: 20px 0;
      display: flex;
      align-items: center;
      gap: 10px;
    }
    .consent-checkbox input[type="checkbox"] {
      width: 20px;
      height: 20px;
    }
    .continue-button {
      padding: 12px 24px;
      background-color: #007bff;
      color: white;
      border: none;
      border-radius: 4px;
      cursor: pointer;
      font-size: 16px;
      transition: background-color 0.2s;
    }
    .continue-button:hover:not(:disabled) {
      background-color: #0056b3;
    }
    .continue-button:disabled {
      background-color: #cccccc;
      cursor: not-allowed;
    }
    ul {
      margin-left: 20px;
      margin-bottom: 20px;
    }
    li {
      margin-bottom: 8px;
    }
  `]
})
export class ConsentComponent {
  accepted = false;

  constructor(private router: Router) {}

  onContinue() {
    if (this.accepted) {
      this.router.navigate(['/presurvey']);
    }
  }
} 