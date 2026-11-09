import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { ThemeService } from './core/state/theme.service';

/** App shell: the portfolio page (`''`) and the admin panel (`admin`, lazy). */
@Component({
  selector: 'app-root',
  imports: [RouterOutlet],
  template: '<router-outlet />',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class App {
  constructor() {
    // Instantiating the service applies data-theme="light" on <html>.
    inject(ThemeService);
  }
}
