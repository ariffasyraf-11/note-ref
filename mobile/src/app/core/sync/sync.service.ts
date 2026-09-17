import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';
import { API_CONFIG } from '../config/api.config';
import { Note } from '../models/note.model';
import { NoteDatabaseService } from '../database/note-database.service';

interface SyncResponse {
  accepted: string[];
}

interface PullResponse {
  notes: Note[];
  cursor: string;
}

@Injectable({ providedIn: 'root' })
export class SyncService {
  private readonly apiUrl = API_CONFIG.baseUrl;
  private lastSync: string | null = null;

  constructor(
    private readonly http: HttpClient,
    private readonly database: NoteDatabaseService,
  ) {}

  async sync(): Promise<void> {
    const pending = await this.database.pending();

    if (pending.length) {
      const response = await firstValueFrom(
        this.http.post<SyncResponse>(`${this.apiUrl}/notes/sync`, { notes: pending }),
      );
      await this.database.markSynced(response.accepted);
    }

    const url = this.lastSync
      ? `${this.apiUrl}/notes?updated_since=${encodeURIComponent(this.lastSync)}`
      : `${this.apiUrl}/notes`;

    const response = await firstValueFrom(this.http.get<PullResponse>(url));
    for (const note of response.notes) {
      await this.database.save({ ...note, syncStatus: 'synced' });
    }
    this.lastSync = response.cursor;
  }
}
