var firebaseConfig = {
    apiKey: "AIzaSyAL3qo72nw_4Z1-N3VYUuuDsT5cLkyAVmk",
    authDomain: "softuniwiki.firebaseapp.com",
    databaseURL: "https://softuniwiki.firebaseio.com",
    projectId: "softuniwiki",
    storageBucket: "softuniwiki.appspot.com",
    messagingSenderId: "253343302378",
    appId: "1:253343302378:web:babf9fb86920e116724d93"
};
// Initialize Firebase
firebase.initializeApp(firebaseConfig);

// rules_version = '2';
// service cloud.firestore {
//   match /databases/{database}/documents {
//     match /{document=**} {
//       allow read, write: if
//           request.time < timestamp.date(2020, 12, 17);
//     }
//   }
// }

// service cloud.firestore {
//     match /databases/{database}/documents {
//       // Make sure the uid of the requesting user matches name of the user
//       // document. The wildcard expression {userId} makes the userId variable
//       // available in rules.
//       match /users/{userId} {
//         allow read, write: if request.auth != null && request.auth.uid == userId;
//       }
//     }
//   }