import { Component, ChangeDetectorRef, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IonButton, IonButtons, IonContent, IonHeader, IonInput, IonItem, IonLabel, IonList, IonSpinner, IonTextarea, IonTitle, IonToolbar } from '@ionic/angular';
import { environment } from '../../environments/environment';
import { NoteDatabaseService, StoredNote } from '../services/note-database.service';

interface Note extends StoredNote {}
interface SyncResponse { accepted: string[]; }
interface PullResponse { notes: Note[]; cursor: string; }
type SyncState = 'idle' | 'syncing' | 'success' | 'error';

@Component({
  selector:'app-home', templateUrl:'home.page.html', styleUrls:['home.page.scss'],
  imports:[CommonModule,FormsModule,IonButton,IonButtons,IonContent,IonHeader,IonInput,IonItem,IonLabel,IonList,IonSpinner,IonTextarea,IonTitle,IonToolbar],
})
export class HomePage implements OnInit {
  notes: Note[] = []; editing=false; editingId:string|null=null; draft={title:'',content:''};
  syncing=false; syncState:SyncState='idle'; syncMessage=''; private initialized=false;
  constructor(private readonly cdr:ChangeDetectorRef, private readonly database:NoteDatabaseService) {}
  async ngOnInit(){ try { await this.database.initialize(); await this.loadNotes(); this.initialized=true; this.refreshView(); } catch(error) { console.error('SQLite initialization failed:',error); this.syncState='error'; this.syncMessage='SQLite requires the native Capacitor test build.'; this.refreshView(); } }
  get pendingCount(){ return this.notes.filter(n=>n.syncStatus==='pending').length; }
  startNew(){this.editingId=null;this.draft={title:'',content:''};this.editing=true;this.resetSyncIndicator();this.refreshView();}
  startEdit(note:Note){this.editingId=note.uuid;this.draft={title:note.title,content:note.content};this.editing=true;this.resetSyncIndicator();this.refreshView();}
  async save(){if(!this.initialized)return;const title=this.draft.title.trim();if(!title)return;const now=new Date().toISOString();const stored=await this.database.getNotes();if(this.editingId){const n=stored.find(x=>x.uuid===this.editingId);if(n){n.title=title;n.content=this.draft.content.trim();n.updatedAt=now;n.deletedAt=null;n.syncStatus='pending';}}else{stored.unshift({uuid:crypto.randomUUID(),title,content:this.draft.content.trim(),updatedAt:now,deletedAt:null,syncStatus:'pending'});}await this.database.saveNotes(stored);await this.loadNotes();this.cancel();this.refreshView();}
  async remove(note:Note){if(!this.initialized||!window.confirm('Delete "'+note.title+'"?'))return;const now=new Date().toISOString();const stored=await this.database.getNotes();const target=stored.find(x=>x.uuid===note.uuid);if(target){target.deletedAt=now;target.updatedAt=now;target.syncStatus='pending';await this.database.saveNotes(stored);}await this.loadNotes();this.resetSyncIndicator();this.refreshView();}
  cancel(){this.editing=false;this.editingId=null;this.draft={title:'',content:''};this.refreshView();}
  async sync(){if(this.syncing||!this.initialized)return;this.syncing=true;this.syncState='syncing';this.syncMessage='Syncing...';this.refreshView();try{let stored=await this.database.getNotes();const pending=stored.filter(n=>n.syncStatus==='pending');if(pending.length){const r=await this.request<SyncResponse>('/notes/sync','POST',{notes:pending});const accepted=new Set(r.accepted);stored=stored.map(n=>accepted.has(n.uuid)?{...n,syncStatus:'synced'}:n);await this.database.saveNotes(stored);}const cursor=await this.database.getCursor();const query=cursor?'?updated_since='+encodeURIComponent(cursor):'';const pulled=await this.request<PullResponse>('/notes'+query,'GET');stored=await this.database.getNotes();for(const remote of pulled.notes){const current=stored.find(n=>n.uuid===remote.uuid);if(!current||current.syncStatus==='synced'||remote.updatedAt>current.updatedAt){const index=stored.findIndex(n=>n.uuid===remote.uuid);const synced:Note={uuid:remote.uuid,title:remote.title,content:remote.content??'',updatedAt:remote.updatedAt,deletedAt:remote.deletedAt??null,syncStatus:'synced'};if(index>=0)stored[index]=synced;else stored.push(synced);}}await this.database.saveNotes(stored);await this.database.setCursor(pulled.cursor);await this.loadNotes();this.syncState='success';this.syncMessage='✓ All changes synced.';}catch(error){console.error('Note sync failed:',error);this.syncState='error';this.syncMessage='Sync failed. Local changes are kept.';}finally{this.syncing=false;this.refreshView();}}
  private resetSyncIndicator(){this.syncState='idle';this.syncMessage='';}
  private refreshView(){this.cdr.detectChanges();}
  private async loadNotes(){this.notes=(await this.database.getNotes()).filter(n=>!n.deletedAt).sort((a,b)=>b.updatedAt.localeCompare(a.updatedAt));}
  private async request<T>(path:string,method:'GET'|'POST',body?:unknown):Promise<T>{const response=await fetch(environment.apiUrl+path,{method,headers:{Accept:'application/json',...(body?{'Content-Type':'application/json'}:{})},...(body?{body:JSON.stringify(body)}:{})});if(!response.ok)throw new Error('API request failed: '+response.status);return response.json() as Promise<T>;}
}