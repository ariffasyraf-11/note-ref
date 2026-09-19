import { Component, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IonButton, IonButtons, IonContent, IonHeader, IonInput, IonItem, IonLabel, IonList, IonSpinner, IonTextarea, IonTitle, IonToolbar } from '@ionic/angular';
import { environment } from '../../environments/environment';

interface Note { uuid:string; title:string; content:string; updatedAt:string; deletedAt:string|null; syncStatus:'pending'|'synced'; }
interface SyncResponse { accepted:string[]; }
interface PullResponse { notes:Note[]; cursor:string; }
type SyncState='idle'|'syncing'|'success'|'error';
const STORAGE_KEY='note-ref.prototype.notes';
const SYNC_CURSOR_KEY='note-ref.prototype.syncCursor';

@Component({
 selector:'app-home', templateUrl:'home.page.html', styleUrls:['home.page.scss'],
 imports:[CommonModule,FormsModule,IonButton,IonButtons,IonContent,IonHeader,IonInput,IonItem,IonLabel,IonList,IonSpinner,IonTextarea,IonTitle,IonToolbar],
})
export class HomePage {
 notes:Note[]=[]; editing=false; editingId:string|null=null; draft={title:'',content:''};
 syncing=false; syncState:SyncState='idle'; syncMessage='';
 constructor(private readonly cdr:ChangeDetectorRef){this.loadNotes();}
 get pendingCount(){return this.readStored().filter(n=>n.syncStatus==='pending').length;}
 startNew(){this.editingId=null;this.draft={title:'',content:''};this.editing=true;this.resetSyncIndicator();this.refreshView();}
 startEdit(note:Note){this.editingId=note.uuid;this.draft={title:note.title,content:note.content};this.editing=true;this.resetSyncIndicator();this.refreshView();}
 save(){const title=this.draft.title.trim();if(!title)return;const now=new Date().toISOString();const stored=this.readStored();if(this.editingId){const n=stored.find(x=>x.uuid===this.editingId);if(n){n.title=title;n.content=this.draft.content.trim();n.updatedAt=now;n.deletedAt=null;n.syncStatus='pending';}}else stored.unshift({uuid:crypto.randomUUID(),title,content:this.draft.content.trim(),updatedAt:now,deletedAt:null,syncStatus:'pending'});this.writeStored(stored);this.loadNotes();this.cancel();this.refreshView();}
 remove(note:Note){if(!window.confirm(`Delete "${note.title}"?`))return;const now=new Date().toISOString();const stored=this.readStored();const target=stored.find(x=>x.uuid===note.uuid);if(target){target.deletedAt=now;target.updatedAt=now;target.syncStatus='pending';this.writeStored(stored);}this.loadNotes();this.resetSyncIndicator();this.refreshView();}
 cancel(){this.editing=false;this.editingId=null;this.draft={title:'',content:''};this.refreshView();}
 async sync(){
  if(this.syncing)return;
  this.syncing=true;this.syncState='syncing';this.syncMessage='Syncing...';this.refreshView();
  try{
   let stored=this.readStored();const pending=stored.filter(n=>n.syncStatus==='pending');
   if(pending.length){const r=await this.request<SyncResponse>('/notes/sync','POST',{notes:pending});const accepted=new Set(r.accepted);stored=stored.map(n=>accepted.has(n.uuid)?{...n,syncStatus:'synced'}:n);this.writeStored(stored);}
   const cursor=localStorage.getItem(SYNC_CURSOR_KEY);const query=cursor?`?updated_since=${encodeURIComponent(cursor)}`:'';const pulled=await this.request<PullResponse>(`/notes${query}`,'GET');stored=this.readStored();
   for(const remote of pulled.notes){const current=stored.find(n=>n.uuid===remote.uuid);if(!current||current.syncStatus==='synced'||remote.updatedAt>current.updatedAt){const index=stored.findIndex(n=>n.uuid===remote.uuid);const synced:Note={uuid:remote.uuid,title:remote.title,content:remote.content??'',updatedAt:remote.updatedAt,deletedAt:remote.deletedAt??null,syncStatus:'synced'};if(index>=0)stored[index]=synced;else stored.push(synced);}}
   this.writeStored(stored);localStorage.setItem(SYNC_CURSOR_KEY,pulled.cursor);this.loadNotes();this.syncState='success';this.syncMessage='✓ All changes synced.';
  }catch(error){console.error('Note sync failed:',error);this.syncState='error';this.syncMessage='Sync failed. Local changes are kept.';}
  finally{this.syncing=false;this.refreshView();}
 }
 private resetSyncIndicator(){this.syncState='idle';this.syncMessage='';}
 private refreshView(){this.cdr.detectChanges();}
 private loadNotes(){this.notes=this.readStored().filter(n=>!n.deletedAt).sort((a,b)=>b.updatedAt.localeCompare(a.updatedAt));}
 private readStored():Note[]{try{const raw=JSON.parse(localStorage.getItem(STORAGE_KEY)??'[]') as Array<Partial<Note>&{id?:string}>;return raw.map(n=>({uuid:n.uuid??n.id??crypto.randomUUID(),title:n.title??'',content:n.content??'',updatedAt:n.updatedAt??new Date().toISOString(),deletedAt:n.deletedAt??null,syncStatus:n.syncStatus??'pending'}));}catch{return [];}}
 private writeStored(notes:Note[]){localStorage.setItem(STORAGE_KEY,JSON.stringify(notes));}
 private async request<T>(path:string,method:'GET'|'POST',body?:unknown):Promise<T>{const response=await fetch(`${environment.apiUrl}${path}`,{method,headers:{Accept:'application/json',...(body?{'Content-Type':'application/json'}:{})},...(body?{body:JSON.stringify(body)}:{})});if(!response.ok)throw new Error(`API request failed: ${response.status}`);return response.json() as Promise<T>;}
}