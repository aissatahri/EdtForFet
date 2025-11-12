import { HttpRequest, HttpHandler, HttpEvent, HttpInterceptorFn } from '@angular/common/http';
import { Observable } from 'rxjs';

export const AuthInterceptor: HttpInterceptorFn = (req: HttpRequest<any>, next: HttpHandler): Observable<HttpEvent<any>> => {
  const token = localStorage.getItem('jwtToken');  // Récupérer le token JWT du localStorage

  if (token) {
    // Ajouter le token JWT à l'en-tête Authorization de chaque requête sortante
    const clonedRequest = req.clone({
      setHeaders: {
        'Authorization': `Bearer ${token}`
      }
    });
    return next.handle(clonedRequest);  // Passer la requête modifiée
  }

  return next.handle(req);  // Si pas de token, passer la requête sans modification
};
