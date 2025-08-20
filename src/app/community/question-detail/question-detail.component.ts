import {
  Component,
  OnInit,
  ViewEncapsulation,
  Inject,
  PLATFORM_ID,
  ViewContainerRef,
} from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import {
  Firestore,
  collection,
  query,
  orderBy,
  getDocs,
  addDoc,
  doc,
  where,
  updateDoc,
  serverTimestamp,
  getDoc,
  setDoc,
  increment,
} from '@angular/fire/firestore';
import {
  FormBuilder,
  FormGroup,
  ReactiveFormsModule,
  FormsModule,
} from '@angular/forms';
import {
  CommonModule,
  DOCUMENT,
  isPlatformBrowser,
  isPlatformServer,
} from '@angular/common';
import { Meta, Title } from '@angular/platform-browser';
import { firstValueFrom } from 'rxjs';

import { AuthService } from '../../services/auth.service';
import { AuthPopupComponent } from '../../payment/auth-popup/auth-popup.component';

@Component({
  selector: 'app-question-detail',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, FormsModule],
  templateUrl: './question-detail.component.html',
  styleUrls: ['./question-detail.component.css'],
  encapsulation: ViewEncapsulation.None,
})
export class QuestionDetailComponent implements OnInit {
  questionId!: string;
  question: any;
  answers: any[] = [];
  answerForm: FormGroup;
  showSuccessPopup = false;

  userVote: 'like' | 'dislike' | null = null;
  hasReported = false;

  // 👉 new: keep buttons disabled until flags are loaded
  isFlagsLoading = true;
  private questionReady = false;

  private currentUid: string | null = null;

  constructor(
    private route: ActivatedRoute,
    private firestore: Firestore,
    private fb: FormBuilder,
    private titleService: Title,
    private meta: Meta,
    @Inject(DOCUMENT) private document: Document,
    @Inject(PLATFORM_ID) private platformId: Object,
    private authService: AuthService,
    private vcr: ViewContainerRef
  ) {
    this.answerForm = this.fb.group({ content: [''] });

    const data = this.route.snapshot.data['question'];
    if (data?.meta && isPlatformServer(this.platformId)) {
      const { title, description, url, image } = data.meta;
      this.titleService.setTitle(title);
      this.meta.updateTag({ name: 'description', content: description });
      this.meta.updateTag({ name: 'robots', content: 'index, follow' });
      this.meta.updateTag({ property: 'og:title', content: title });
      this.meta.updateTag({ property: 'og:description', content: description });
      this.meta.updateTag({ property: 'og:url', content: url });
      this.meta.updateTag({ property: 'og:image', content: image });
      this.meta.updateTag({ property: 'og:type', content: 'article' });
      this.meta.updateTag({ name: 'twitter:title', content: title });
      this.meta.updateTag({ name: 'twitter:description', content: description });
      this.meta.updateTag({ name: 'twitter:image', content: image });
      this.meta.updateTag({ name: 'twitter:card', content: 'summary_large_image' });

      const link: HTMLLinkElement = this.document.createElement('link');
      link.setAttribute('rel', 'canonical');
      link.setAttribute('href', url);
      this.document.head.appendChild(link);
    }
  }

  async ngOnInit() {
    const slug = this.route.snapshot.paramMap.get('slug');
    if (!slug) return;

    const data = this.route.snapshot.data['question'];
    this.questionId = data.id;
    this.question = data;
    this.questionReady = true; // question id is known

    if (isPlatformBrowser(this.platformId)) {
      // Observe auth and load flags when both uid and qid are known
      this.authService.getCurrentUser().subscribe(async user => {
        this.currentUid = user?.uid || null;
        if (this.currentUid && this.questionReady) {
          await this.loadUserFlags();
        } else if (!this.currentUid) {
          // no user -> stop the loading spinner so buttons enable in neutral state
          this.isFlagsLoading = false;
        }
      });

      await this.fetchQuestionFromFirestore(slug);
      await this.fetchAnswers();
      this.injectStructuredData();

      // If uid already present by now, make sure flags are loaded
      if (this.currentUid) {
        await this.loadUserFlags();
      } else {
        this.isFlagsLoading = false;
      }
    }
  }

  // --------- data fetch ---------
  async fetchQuestionFromFirestore(slug: string) {
    const questionsRef = collection(this.firestore, 'QUESTIONS_PATH');
    const q = query(questionsRef, where('slug', '==', slug));
    const snap = await getDocs(q);
    if (!snap.empty) {
      const docSnap = snap.docs[0];
      const fullData = docSnap.data();
      this.question = { ...this.question, ...fullData };
      this.questionId = docSnap.id;
    }
  }

  async fetchAnswers() {
    if (!this.questionId) return;
    const answersRef = collection(
      this.firestore,
      `QUESTIONS_PATH/${this.questionId}/answers`
    );
    const q = query(answersRef, orderBy('createdAt', 'desc'));
    const snap = await getDocs(q);
    this.answers = snap.docs.map(d => d.data());
  }

  private injectStructuredData() {
    const data: any = {
      '@context': 'https://schema.org',
      '@type': 'Question',
      name: this.question?.title,
      text: this.question?.description,
      dateCreated: this.question?.createdAt?.toDate?.(),
      author: { '@type': 'Person', name: 'Anonymous' },
      answerCount: this.answers.length,
    };
    if (this.answers.length > 0) {
      data.acceptedAnswer = {
        '@type': 'Answer',
        text: this.answers[0]?.content,
        dateCreated: this.answers[0]?.createdAt?.toDate?.(),
        upvoteCount: this.answers[0]?.upvotes || 0,
        author: { '@type': 'Person', name: 'Anonymous' },
      };
    }
    const script = this.document.createElement('script');
    script.type = 'application/ld+json';
    script.text = JSON.stringify(data);
    this.document.head.appendChild(script);
  }

  // --------- auth gates with custom popup ---------
  private async ensureSignedIn(): Promise<boolean> {
    const user = await firstValueFrom(this.authService.getCurrentUser());
    if (user) {
      this.currentUid = user.uid;
      return true;
    }
    return false;
  }

  private showLoginPopup(title: string, subtitle: string) {
    this.vcr.clear();
    const ref = this.vcr.createComponent(AuthPopupComponent);
    ref.instance.title = title;
    ref.instance.subtitle = subtitle;

    // close (X or Cancel)
    ref.instance.closed.subscribe(() => this.vcr.clear());

    // success
    const onAuthSuccess = () => {
      this.vcr.clear();
      window.removeEventListener('auth-success', onAuthSuccess);
      this.loadUserFlags();
    };
    window.addEventListener('auth-success', onAuthSuccess);
  }

  private async ensureSignedInWithPopup(title: string, subtitle: string) {
    const ok = await this.ensureSignedIn();
    if (!ok) this.showLoginPopup(title, subtitle);
    return ok;
  }

  // --------- load per-user flags ---------
  private async loadUserFlags() {
    if (!this.currentUid || !this.questionId) {
      this.isFlagsLoading = false;
      return;
    }
    this.isFlagsLoading = true;

    // vote
    const voteRef = doc(
      this.firestore,
      `QUESTIONS_PATH/${this.questionId}/votes/${this.currentUid}`
    );
    const voteSnap = await getDoc(voteRef);
    this.userVote = voteSnap.exists() ? ((voteSnap.data() as any).vote ?? null) : null;

    // report
    const reportRef = doc(
      this.firestore,
      `QUESTIONS_PATH/${this.questionId}/reports/${this.currentUid}`
    );
    const reportSnap = await getDoc(reportRef);
    this.hasReported = reportSnap.exists();

    this.isFlagsLoading = false;
  }

  // --------- UI handlers (custom messages) ---------
  async onLikeClick() {
    if (!(await this.ensureSignedInWithPopup('Sign in to Vote', 'Log in to like or dislike this question.'))) return;
    await this.likeQuestion();
    await this.loadUserFlags(); // keep UI in sync
  }
  async onDislikeClick() {
    if (!(await this.ensureSignedInWithPopup('Sign in to Vote', 'Log in to like or dislike this question.'))) return;
    await this.dislikeQuestion();
    await this.loadUserFlags();
  }
  async onReportClick() {
    if (!(await this.ensureSignedInWithPopup('Sign in to Report', 'You must be logged in to report content.'))) return;
    await this.reportQuestion();
    await this.loadUserFlags();
  }
  async onSubmitAnswerClick() {
    if (!(await this.ensureSignedInWithPopup('Sign in to Answer', 'Please log in before posting your answer.'))) return;
    await this.submitAnswer();
  }

  // --------- writes ---------
  async submitAnswer() {
    const content = (this.answerForm.value.content || '').trim();
    if (!content || !this.currentUid) return;

    const user = await firstValueFrom(this.authService.getCurrentUser());
    const answersRef = collection(
      this.firestore,
      `QUESTIONS_PATH/${this.questionId}/answers`
    );
    await addDoc(answersRef, {
      content,
      createdAt: serverTimestamp(),
      author: user?.displayName || user?.email || 'Anonymous',
      authorId: this.currentUid,
      upvotes: 0,
    });

    const questionRef = doc(this.firestore, `QUESTIONS_PATH/${this.questionId}`);
    await updateDoc(questionRef, {
      answersCount: (this.question.answersCount || 0) + 1,
    });

    this.answerForm.reset();
    this.showSuccessPopup = true;
    await this.fetchAnswers();
    setTimeout(() => (this.showSuccessPopup = false), 2000);
  }

  async likeQuestion() {
    if (!this.questionId || !this.currentUid) return;

    const questionRef = doc(this.firestore, `QUESTIONS_PATH/${this.questionId}`);
    const voteRef = doc(
      this.firestore,
      `QUESTIONS_PATH/${this.questionId}/votes/${this.currentUid}`
    );

    const prevSnap = await getDoc(voteRef);
    const prev = prevSnap.exists() ? (prevSnap.data() as any).vote : null;
    if (prev === 'like') return;

    if (prev === 'dislike') {
      await updateDoc(questionRef, { dislikes: increment(-1) });
      this.question.dislikes = (this.question.dislikes || 1) - 1;
    }

    await updateDoc(questionRef, { likes: increment(1) });
    await setDoc(voteRef, { vote: 'like', at: serverTimestamp() });

    this.question.likes = (this.question.likes || 0) + 1;
    this.userVote = 'like';
  }

  async dislikeQuestion() {
    if (!this.questionId || !this.currentUid) return;

    const questionRef = doc(this.firestore, `QUESTIONS_PATH/${this.questionId}`);
    const voteRef = doc(
      this.firestore,
      `QUESTIONS_PATH/${this.questionId}/votes/${this.currentUid}`
    );

    const prevSnap = await getDoc(voteRef);
    const prev = prevSnap.exists() ? (prevSnap.data() as any).vote : null;
    if (prev === 'dislike') return;

    if (prev === 'like') {
      await updateDoc(questionRef, { likes: increment(-1) });
      this.question.likes = (this.question.likes || 1) - 1;
    }

    await updateDoc(questionRef, { dislikes: increment(1) });
    await setDoc(voteRef, { vote: 'dislike', at: serverTimestamp() });

    this.question.dislikes = (this.question.dislikes || 0) + 1;
    this.userVote = 'dislike';
  }

  async reportQuestion() {
    if (!this.questionId || !this.currentUid || this.hasReported) return;

    const questionRef = doc(this.firestore, `QUESTIONS_PATH/${this.questionId}`);
    const reportRef = doc(
      this.firestore,
      `QUESTIONS_PATH/${this.questionId}/reports/${this.currentUid}`
    );

    await updateDoc(questionRef, { reports: increment(1) });
    await setDoc(reportRef, { at: serverTimestamp() });

    this.question.reports = (this.question.reports || 0) + 1;
    this.hasReported = true;

    alert('🚩 Thanks for flagging! Our team will review this question.');
  }
}
