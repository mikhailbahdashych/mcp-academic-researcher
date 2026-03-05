import { Component, Input, Output, EventEmitter } from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatTooltipModule } from '@angular/material/tooltip';
import { ChatSession } from '@core/models/chat.models';

@Component({
  selector: 'app-session-item',
  standalone: true,
  imports: [RouterLink, RouterLinkActive, MatIconModule, MatButtonModule, MatTooltipModule],
  templateUrl: './session-item.component.html',
  styleUrl: './session-item.component.scss',
})
export class SessionItemComponent {
  @Input({ required: true }) session!: ChatSession;
  @Output() deleteSession = new EventEmitter<string>();
}
