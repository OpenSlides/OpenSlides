import { Injectable } from '@angular/core';
import {
  HttpClient, HttpResponse,
  HttpErrorResponse, HttpHeaders
} from '@angular/common/http';
import { Observable, of, throwError } from 'rxjs';
import { catchError, map, tap, delay } from 'rxjs/operators';

import { User } from '../users/user';

const httpOptions = {
  withCredentials: true,
  headers: new HttpHeaders({
    'Content-Type': 'application/json'
  })
};

@Injectable({
  providedIn: 'root'
})
export class AuthenticationService {
  isLoggedIn: boolean;
  loginURL: string = '/users/login/'

  // store the URL so we can redirect after logging in
  redirectUrl: string;

  constructor(private http: HttpClient) {

    //check for the cookie in local storrage
    //TODO checks for username now since django does not seem to return a cookie
    if(localStorage.getItem("username")) {
      this.isLoggedIn = true;
    } else {
      this.isLoggedIn = false;
    }

  }

  //loggins a users. expects a user model
  loginUser(user: User): Observable<any> {
    return this.http.post(this.loginURL, user, httpOptions)
      .pipe(
        tap(val => {
          this.isLoggedIn = true;
          //Set the session cookie in local storrage.
          //TODO needs validation
        }),
        catchError(this.handleError())
      );
  }


  //logout the user
  //TODO not yet used
  logoutUser(): void {
    this.isLoggedIn = false;
    localStorage.removeItem("username");
  }

  //very generic error handling function.
  //implicitly returns an observable that will display an error message
  private handleError<T>() {
    return (error: any): Observable<T> => {
      console.error(error);
      return of(error);
    }
  };
}
