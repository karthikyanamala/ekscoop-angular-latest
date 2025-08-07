import { Component } from '@angular/core';
import { Firestore, collection, addDoc, serverTimestamp } from '@angular/fire/firestore';
import { Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-ask-question',
  standalone: true,
  templateUrl: './ask-question.component.html',
  styleUrls: ['./ask-question.component.css'],
  imports: [CommonModule, FormsModule],
})
export class AskQuestionComponent {
  question = {
    title: '',
    description: '',
    tags: [] as string[],
  };
  tagInput = '';
  showPopup = false;

  constructor(private firestore: Firestore, private router: Router) {}

  async submitQuestion() {
    const { title, description } = this.question;
    if (!title.trim() || !description.trim()) {
      alert('Title and description are required.');
      return;
    }

    // Process tags from input
    this.question.tags = this.tagInput
      .split(',')
      .map(tag => tag.trim().toLowerCase())
      .filter(Boolean);

    // Generate SEO-friendly slug
    const slug = title
      .toLowerCase()
      .replace(/\s+/g, '-')         // Replace spaces with -
      .replace(/[^a-z0-9\-]/g, '')  // Remove invalid chars
      .replace(/\-+/g, '-')         // Collapse multiple -
      .replace(/^\-+|\-+$/g, '');   // Trim leading/trailing -

    const docData = {
      title,
      description,
      tags: this.question.tags,
      slug,
      createdAt: serverTimestamp(),
      views: 0,
      upvotes: 0,
      answersCount: 0,
    };

    try {
      console.log('[QuestionDetailComponent2345678654567u8] Fetching answers...');
      await addDoc(collection(this.firestore, 'QUESTIONS_PATH'), docData);
      this.showPopup = true;

      setTimeout(() => {
        this.showPopup = false;
        this.router.navigate(['/comminity']);
      }, 2500);
    } catch (error) {
      console.error('Failed to submit question:', error);
      alert('Something went wrong. Please try again.');
    }
  }
}
