import {
  Component,
  OnInit,
  ViewEncapsulation,
  Inject,
  PLATFORM_ID
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
  serverTimestamp
} from '@angular/fire/firestore';
import {
  FormBuilder,
  FormGroup,
  ReactiveFormsModule,
  FormsModule
} from '@angular/forms';
import {
  CommonModule,
  DOCUMENT,
  isPlatformBrowser,
  isPlatformServer
} from '@angular/common';
import { Meta, Title } from '@angular/platform-browser';
import { increment } from '@angular/fire/firestore';

@Component({
  selector: 'app-question-detail',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, FormsModule],
  templateUrl: './question-detail.component.html',
  styleUrls: ['./question-detail.component.css'],
  encapsulation: ViewEncapsulation.None
})
// ... imports same as before ...

export class QuestionDetailComponent implements OnInit {
  questionId!: string;
  question: any;
  answers: any[] = [];
  answerForm: FormGroup;
  showSuccessPopup = false;
   userVote: 'like' | 'dislike' | null = null;
  hasReported = false;

  constructor(
    private route: ActivatedRoute,
    private firestore: Firestore,
    private fb: FormBuilder,
    private titleService: Title,
    private meta: Meta,
    @Inject(DOCUMENT) private document: Document,
    @Inject(PLATFORM_ID) private platformId: Object
  ) {
    this.answerForm = this.fb.group({ content: [''] });

    const slug = this.route.snapshot.paramMap.get('slug');
    const data = this.route.snapshot.data['question'];

    // ✅ SSR: inject meta
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

    if (isPlatformBrowser(this.platformId)) {
      // ✅ Only in browser: fetch full question and answers
      await this.fetchQuestionFromFirestore(slug);
      await this.fetchAnswers();
      this.injectStructuredData();
    }
  }


  async fetchQuestionFromFirestore(slug: string) {
    console.log('[QuestionDetailComponent345678765456y7] Fetching answers...');
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
    console.log('[QuestionDetailComponent2345676543] Fetching answers...');
    const answersRef = collection(
      this.firestore,
      `QUESTIONS_PATH/${this.questionId}/answers`
    );
    const q = query(answersRef, orderBy('createdAt', 'desc'));
    const snap = await getDocs(q);
    this.answers = snap.docs.map(doc => doc.data());
  }

  private injectStructuredData() {
    const data: any = {
      "@context": "https://schema.org",
      "@type": "Question",
      "name": this.question?.title,
      "text": this.question?.description,
      "dateCreated": this.question?.createdAt?.toDate?.(),
      "author": { "@type": "Person", "name": "Anonymous" },
      "answerCount": this.answers.length
    };

    if (this.answers.length > 0) {
      data.acceptedAnswer = {
        "@type": "Answer",
        "text": this.answers[0]?.content,
        "dateCreated": this.answers[0]?.createdAt?.toDate?.(),
        "upvoteCount": this.answers[0]?.upvotes || 0,
        "author": { "@type": "Person", "name": "Anonymous" }
      };
    }

    const script = this.document.createElement('script');
    script.type = 'application/ld+json';
    script.text = JSON.stringify(data);
    this.document.head.appendChild(script);
  }

  async submitAnswer() {
    const content = this.answerForm.value.content.trim();
    if (!content) return;
    console.log('[QuestionDetailComponent34567890987654] Fetching answers...');
    const answersRef = collection(
      this.firestore,
      `QUESTIONS_PATH/${this.questionId}/answers`
    );
    await addDoc(answersRef, {
      content,
      createdAt: serverTimestamp(),
      author: 'Anonymous',
      upvotes: 0
    });

    const questionRef = doc(this.firestore, `QUESTIONS_PATH/${this.questionId}`);
    await updateDoc(questionRef, {
      answersCount: (this.question.answersCount || 0) + 1
    });

    this.answerForm.reset();
    this.showSuccessPopup = true;
    await this.fetchAnswers();

    setTimeout(() => {
      this.showSuccessPopup = false;
    }, 2000);
  }

  // ✅ Like
  async likeQuestion() {
    if (!this.questionId || this.userVote === 'like') return;

    const questionRef = doc(this.firestore, `QUESTIONS_PATH/${this.questionId}`);

    // Remove previous dislike if any
    if (this.userVote === 'dislike') {
      await updateDoc(questionRef, {
        dislikes: increment(-1)
      });
      this.question.dislikes = (this.question.dislikes || 1) - 1;
    }

    await updateDoc(questionRef, {
      likes: increment(1)
    });

    this.question.likes = (this.question.likes || 0) + 1;
    this.userVote = 'like';
  }

  // ✅ Dislike
  async dislikeQuestion() {
    if (!this.questionId || this.userVote === 'dislike') return;

    const questionRef = doc(this.firestore, `QUESTIONS_PATH/${this.questionId}`);

    // Remove previous like if any
    if (this.userVote === 'like') {
      await updateDoc(questionRef, {
        likes: increment(-1)
      });
      this.question.likes = (this.question.likes || 1) - 1;
    }

    await updateDoc(questionRef, {
      dislikes: increment(1)
    });

    this.question.dislikes = (this.question.dislikes || 0) + 1;
    this.userVote = 'dislike';
  }

  // ✅ Report
  async reportQuestion() {
    if (!this.questionId || this.hasReported) return;

    const questionRef = doc(this.firestore, `QUESTIONS_PATH/${this.questionId}`);
    await updateDoc(questionRef, {
      reports: increment(1)
    });

    this.question.reports = (this.question.reports || 0) + 1;
    this.hasReported = true;

    alert("🚩 Thanks for flagging! Our team will review this question.");
  }
}

