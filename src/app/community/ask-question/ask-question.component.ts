import { Component, Inject, PLATFORM_ID, ViewContainerRef } from '@angular/core';
import { Firestore, collection, addDoc, serverTimestamp, getDocs, query, where } from '@angular/fire/firestore';
import { Router } from '@angular/router';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { firstValueFrom } from 'rxjs';

import { AuthService } from '../../services/auth.service';
import { AuthPopupComponent } from '../../payment/auth-popup/auth-popup.component';

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
  isPosting = false;

  private currentUid: string | null = null;

  constructor(
    private firestore: Firestore,
    private router: Router,
    private authService: AuthService,
    private vcr: ViewContainerRef,
    @Inject(PLATFORM_ID) private platformId: Object
  ) {}

  // ---------- UI handler: gate + submit ----------
  async onSubmitClick() {
    const { title, description } = this.question;
    if (!title.trim() || !description.trim()) {
      alert('Title and description are required.');
      return;
    }

    if (!(await this.ensureSignedInForAsk())) return;
    await this.submitQuestion();
  }

  // ---------- Auth gate (custom popup message just for Ask Question) ----------
  private async ensureSignedInForAsk(): Promise<boolean> {
    const user = await firstValueFrom(this.authService.getCurrentUser());
    if (user) {
      this.currentUid = user.uid;
      return true;
    }

    if (isPlatformBrowser(this.platformId)) {
      this.vcr.clear();

      // Create the popup ONCE
      const ref = this.vcr.createComponent(AuthPopupComponent);
      ref.instance.title = 'Sign in to Ask a Question';
      ref.instance.subtitle = 'You must be logged in to ask a question on ekScoop.';

      // Close button (X / Cancel)
      ref.instance.closed.subscribe(() => {
        this.vcr.clear();
      });

      // On successful auth from popup
      const onAuthSuccess = async () => {
        this.vcr.clear();
        window.removeEventListener('auth-success', onAuthSuccess);
        const u = await firstValueFrom(this.authService.getCurrentUser());
        this.currentUid = u?.uid || null;
        // Optionally auto-continue submit here if you want:
        // if (this.currentUid) this.onSubmitClick();
      };
      window.addEventListener('auth-success', onAuthSuccess);
    }

    return false;
  }

  // ---------- Core submit ----------
  async submitQuestion() {
    try {
      this.isPosting = true;

      // Process tags from input
      this.question.tags = this.tagInput
        .split(',')
        .map(tag => tag.trim().toLowerCase())
        .filter(Boolean);

      // Base slug
      let slug = this.slugify(this.question.title);

      // Ensure uniqueness: if same slug exists, append -2, -3, ...
      slug = await this.ensureUniqueSlug(slug);

      // Author info
      const user = await firstValueFrom(this.authService.getCurrentUser());

      const docData = {
        title: this.question.title.trim(),
        description: this.question.description.trim(),
        tags: this.question.tags,
        slug,
        createdAt: serverTimestamp(),
        views: 0,
        likes: 0,
        dislikes: 0,
        reports: 0,
        answersCount: 0,
        authorId: user?.uid || null,
        author: user?.displayName || user?.email || 'Anonymous',
      };

      await addDoc(collection(this.firestore, 'QUESTIONS_PATH'), docData);

      this.showPopup = true;
      setTimeout(() => {
        this.showPopup = false;
        this.router.navigate(['/community']); // adjust if your route differs
      }, 2000);
    } catch (error) {
      console.error('Failed to submit question:', error);
      alert('Something went wrong. Please try again.');
    } finally {
      this.isPosting = false;
    }
  }

  // ---------- Helpers ----------
  private slugify(s: string): string {
    return s
      .toLowerCase()
      .replace(/\s+/g, '-')
      .replace(/[^a-z0-9\-]/g, '')
      .replace(/\-+/g, '-')
      .replace(/^\-+|\-+$/g, '');
  }

  private async ensureUniqueSlug(base: string): Promise<string> {
    let candidate = base;
    let i = 2;
    while (true) {
      const qSnap = await getDocs(
        query(collection(this.firestore, 'QUESTIONS_PATH'), where('slug', '==', candidate))
      );
      if (qSnap.empty) return candidate;
      candidate = `${base}-${i++}`;
    }
  }
}
