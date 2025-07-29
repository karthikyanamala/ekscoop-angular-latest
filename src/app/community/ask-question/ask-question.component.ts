import { Component } from '@angular/core';
import { Firestore, collection, addDoc, serverTimestamp } from '@angular/fire/firestore';
import { Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-ask-question',
  templateUrl: './ask-question.component.html',
  standalone: true,
  imports: [CommonModule, FormsModule],
  styleUrls: ['./ask-question.component.css'],
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
    if (!this.question.title.trim() || !this.question.description.trim()) {
      alert('Title and description are required.');
      return;
    }

    this.question.tags = this.tagInput
      .split(',')
      .map(tag => tag.trim().toLowerCase())
      .filter(Boolean);

    const slug = this.question.title
      .toLowerCase()
      .replace(/\s+/g, '-')         // Replace spaces with -
      .replace(/[^a-z0-9\-]/g, '')  // Remove non-alphanumeric characters except -
      .replace(/\-+/g, '-')         // Replace multiple - with single -
      .replace(/^\-+|\-+$/g, '');   // Trim leading/trailing -

    const docData = {
      title: this.question.title,
      description: this.question.description,
      tags: this.question.tags,
      createdAt: serverTimestamp(),
      views: 0,
      upvotes: 0,
      answersCount: 0,
      slug, // ✅ now properly generated
    };

    await addDoc(collection(this.firestore, 'QUESTIONS_PATH'), docData);

    this.showPopup = true;

    setTimeout(() => {
      this.showPopup = false;
      this.router.navigate(['/comminity']);
    }, 2500);
  }
}
