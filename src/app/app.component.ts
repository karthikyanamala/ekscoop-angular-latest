import { Component, ViewEncapsulation } from '@angular/core';
import { RouterOutlet } from '@angular/router';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet],
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css'], // ✅ Fix: styleUrls not styleUrl
  encapsulation: ViewEncapsulation.None, // ✅ Important for global styles
})
export class AppComponent {
  title = 'ekscoop';

  constructor() {
    console.log('AppComponent loaded ✅'); // ✅ Safe place for logs
  }
}
