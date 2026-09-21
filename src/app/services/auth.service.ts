import { Injectable } from '@angular/core';
import { environment } from '../../environments/environment';

export interface AuthUser { id:number; name:string; email:string; }
interface AuthResponse { user:AuthUser; token:string; }
const TOKEN_KEY='note-ref.prototype.authToken';
const USER_KEY='note-ref.prototype.authUser';

@Injectable({providedIn:'root'})
export class AuthService {
  get token():string|null{return localStorage.getItem(TOKEN_KEY);}
  get user():AuthUser|null{try{const raw=localStorage.getItem(USER_KEY);return raw?JSON.parse(raw):null;}catch{return null;}}
  get isAuthenticated():boolean{return !!this.token;}
  async login(email:string,password:string):Promise<AuthUser>{const r=await this.request<AuthResponse>('/auth/login','POST',{email,password});this.store(r);return r.user;}
  async register(name:string,email:string,password:string,passwordConfirmation:string):Promise<AuthUser>{const r=await this.request<AuthResponse>('/auth/register','POST',{name,email,password,password_confirmation:passwordConfirmation});this.store(r);return r.user;}
  async logout():Promise<void>{if(this.token)await this.request('/auth/logout','POST',undefined,true).catch(()=>{});localStorage.removeItem(TOKEN_KEY);localStorage.removeItem(USER_KEY);}
  private store(r:AuthResponse){localStorage.setItem(TOKEN_KEY,r.token);localStorage.setItem(USER_KEY,JSON.stringify(r.user));}
  private async request<T=unknown>(path:string,method:'GET'|'POST',body?:unknown,authenticated=false):Promise<T>{const headers:Record<string,string>={Accept:'application/json'};if(body)headers['Content-Type']='application/json';if(authenticated&&this.token)headers.Authorization=`Bearer ${this.token}`;const response=await fetch(`${environment.apiUrl}${path}`,{method,headers,...(body?{body:JSON.stringify(body)}:{})});if(!response.ok)throw new Error(`Authentication request failed: ${response.status}`);return response.json() as Promise<T>;}
}
