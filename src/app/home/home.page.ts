import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import {
  IonButton,
  IonButtons,
  IonContent,
  IonHeader,
  IonInput,
  IonItem,
  IonLabel,
  IonList,
  IonTextarea,
  IonTitle,
  IonToolbar,
} from '@ionic/angular/standalone';

interface Note {
  id: string;
  title: string;
  content: string;
  updatedAt: string;
}

const STORAGE_KEY = 'note-ref.prototype.notes';

@Component({
  selector: 'app-home',
  templateUrl: 'home.page.html',
  styleUrls: ['home.page.scss'],
  imports: [
    CommonModule,
    FormsModule,
    IonButton,
    IonButtons,
    IonContent,
    IonHeader,
    IonInput,
    IonItem,
    IonLabel,
    IonList,
    IonTextarea,
    IonTitle,
    IonToolbar,
  ],
})
export class HomePage {
  notes: Note[] = [];
  editing = false;
  editingId: string | null = null;
  draft = { title: '', content: '' };

  constructor() {
    this.loadNotes();
  }

  startNew(): void {
    this.editingId = null;
    this.draft = { title: '', content: '' };
    this.editing = true;
  }

  startEdit(note: Note): void {
    this.editingId = note.id;
    this.draft = { title: note.title, content: note.content };
    this.editing = true;
  }

  save(): void {
    const title = this.draft.title.trim();
    if (!title) return;

    const now = new Date().toISOString();

    if (this.editingId) {
      const note = this.notes.find((item) => item.id === this.editingId);
      if (note) {
        note.title = title;
        note.content = this.draft.content.trim();
        note.updatedAt = now;
      }
    } else {
      this.notes.unshift({
        id: crypto.randomUUID(),
        title,
        content: this.draft.content.trim(),
        updatedAt: now,
      });
    }

    this.persist();
    this.cancel();
  }

  remove(note: Note): void {
    if (!window.confirm(`Delete "${note.title}"?`)) return;

    this.notes = this.notes.filter((item) => item.id !== note.id);
    this.persist();
  }

  cancel(): void {
    this.editing = false;
    this.editingId = null;
    this.draft = { title: '', content: '' };
  }

  private loadNotes(): void {
    try {
      this.notes = JSON.parse(localStorage.getItem(STORAGE_KEY) ?? '[]') as Note[];
    } catch {
      this.notes = [];
    }
  }

  private persist(): void {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(this.notes));
  }
}
