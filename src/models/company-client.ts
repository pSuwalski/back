export interface CompanyClient {
  type: 'person' | 'company';
  basicData: any; // Dane człowieka i firmy jako proste interfejsy
  contactData: any;
  parcels: string[];
  

}


// narysować drzewo zależności i ścieżek użytkownika
// Dodawanie musi być bardziej rozgałęzione na typy: osoba, uchwała(dotyczy wszystkich działek), działka, wykonane prace, płatności w osobie

// Dodawanie uchwały ilość wpłat ustalana przez select dodawanie kolejnych to dodawnie z lat poprzednich

// Działek można dodać kilka, procent wspówłaścicielstwa

/*
Trzy typy płatności : wpłata, umożenie, doliczenia dodatkowe
formularze dla kadego typu przy dodawniu dropdown z wyborem typu operacji na saldzie
*/

// historia tylko z dnia
// historia podział na typ wyszukiwania
// wyszukiwarka w historii
