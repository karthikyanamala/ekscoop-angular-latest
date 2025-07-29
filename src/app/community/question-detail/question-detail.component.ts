import { Component, OnInit, ViewEncapsulation, Inject } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import {
  Firestore,
  collection,
  query,
  where,
  getDocs,
  doc,
  getDoc,
  addDoc,
  orderBy,
  serverTimestamp,
  updateDoc
} from '@angular/fire/firestore';
import { FormBuilder, FormGroup, ReactiveFormsModule, FormsModule } from '@angular/forms';
import { CommonModule, DOCUMENT } from '@angular/common';
import { Meta, Title } from '@angular/platform-browser';

@Component({
  selector: 'app-question-detail',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, FormsModule],
  templateUrl: './question-detail.component.html',
  styleUrls: ['./question-detail.component.css'],
  encapsulation: ViewEncapsulation.None
})
export class QuestionDetailComponent implements OnInit {
  questionId!: string;
  question: any;
  answers: any[] = [];
  answerForm: FormGroup;
  showSuccessPopup = false;

  constructor(
    private route: ActivatedRoute,
    private firestore: Firestore,
    private fb: FormBuilder,
    private titleService: Title,
    private meta: Meta,
    @Inject(DOCUMENT) private document: Document
  ) {
    this.answerForm = this.fb.group({
      content: ['']
    });
  }

  async ngOnInit() {
    const slug = this.route.snapshot.paramMap.get('slug');
    if (!slug) return;

    const qRef = collection(this.firestore, 'QUESTIONS_PATH');
    const q = query(qRef, where('slug', '==', slug));
    const snap = await getDocs(q);

    if (!snap.empty) {
      const docSnap = snap.docs[0];
      this.question = docSnap.data();
      this.questionId = docSnap.id;

      this.setMetaTags(slug);          // ✅ Add dynamic meta tags
      this.injectStructuredData();     // ✅ Inject JSON-LD
      await this.fetchAnswers();
    } else {
      console.error('Question not found for slug:', slug);
    }
  }

  async fetchAnswers() {
    const answersRef = collection(this.firestore, `QUESTIONS_PATH/${this.questionId}/answers`);
    const q = query(answersRef, orderBy('createdAt', 'desc'));
    const snap = await getDocs(q);
    this.answers = snap.docs.map(doc => doc.data());
  }

  async submitAnswer() {
    const content = this.answerForm.value.content.trim();
    if (!content) return;

    const answersRef = collection(this.firestore, `QUESTIONS_PATH/${this.questionId}/answers`);
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

  private setMetaTags(slug: string) {
    this.titleService.setTitle(this.question?.title || 'Question Detail | ekScoop');
    this.meta.updateTag({ name: 'description', content: this.question?.description || '' });

    // Open Graph (OG) tags for social sharing
    const url = `https://ekscoop.com/questions/${slug}`;
    this.meta.updateTag({ property: 'og:title', content: this.question?.title });
    this.meta.updateTag({ property: 'og:description', content: this.question?.description });
    this.meta.updateTag({ property: 'og:url', content: url });
    this.meta.updateTag({ property: 'og:type', content: 'article' });
  }

  private injectStructuredData() {
    const data: any = {
      "@context": "https://schema.org",
      "@type": "Question",
      "name": this.question?.title,
      "text": this.question?.description,
      "dateCreated": this.question?.createdAt?.toDate(),
      "author": {
        "@type": "Person",
        "name": "Anonymous"
      },
      "answerCount": this.answers.length,
    };

    if (this.answers.length > 0) {
      data.acceptedAnswer = {
        "@type": "Answer",
        "text": this.answers[0]?.content,
        "dateCreated": this.answers[0]?.createdAt?.toDate(),
        "upvoteCount": this.answers[0]?.upvotes || 0,
        "author": {
          "@type": "Person",
          "name": "Anonymous"
        }
      };
    }

    const script = this.document.createElement('script');
    script.type = 'application/ld+json';
    script.text = JSON.stringify(data);
    this.document.head.appendChild(script);
  }
}
