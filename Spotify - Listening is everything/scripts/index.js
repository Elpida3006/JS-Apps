const userModel = firebase.auth();
const DB = firebase.firestore();

const app = Sammy('#container', function () {
    this.use('Handlebars', 'hbs');

    
    this.get('#/home', function (context) {
      

                extendContext(context)
                    .then(function () {
                        this.partial('./templates/home.hbs');
                    });
           
    });
    
    this.get('#/all-song', function (context) {
      
       
        DB.collection('songs')
            .get()
            .then(response => {
                context.songs = response.docs.map((song) => { 
                    const songData = song.data()
                    const { uid } = getUserData()
                    const isCreator = songData.creator === uid ? true : false
                    return { id: song.id, ...song.data() , isCreator} 
                })

                extendContext(context)
                    .then(function () {
                        this.partial('./templates/all-song.hbs');
                    });
            })
            .catch(errorHandler);
    });
    this.get('#/my-song', function (req) {
        const userId = getUserData().uid;
        // The songs should be ordered first by the amount of likes in descending,
        // then by the "listened" counter in descending
const isCreator = true;
        DB.collection('songs')
        .orderBy('likes',"desc")
        .orderBy('listened', "desc")
            .get()
            .then(songs => {
                req.userSong = songs.docs
                    .filter(song => song.data().creator == userId)
                    .map((song) => {
                     
                        return {
                            id: song.id,
                            ...song.data(),
                            isCreator
                        }
                    })

                extendContext(req).then(function () {
                    this.partial('./templates/my-song.hbs');
                });
            }).catch(errorHandler);;
    });

    this.get('#/register', function (context) {
        extendContext(context)
            .then(function () {
                this.partial('./templates/register.hbs');
            });
    });
    this.post('#/register', function (context) {
        const { email, password, rePassword } = context.params;

        if (email.length === 0 || password.length === 0 || rePassword.length === 0) {
            notify.showError('You must fill all fields.');
            return;
        };

        if (password.length < 6) {
            notify.showError('The password must be at least 6 characters long.');
            return;
        };

        if (password !== rePassword) {
            notify.showError('The passwords do not match!');
            return;
        };

        userModel.createUserWithEmailAndPassword(email, password)
            .then((userData) => {
                saveUserData(userData);
                this.redirect('#/home');
            })
            .then(() => {
                notify.showInfo('User registration successful.');
            })
            .catch(errorHandler);
    });

    this.get('#/login', function (context) {
        extendContext(context)
            .then(function () {
                this.partial('./templates/login.hbs');
            });
    });
    this.post('#/login', function (context) {
        const { email, password } = context.params;

        if (email.length === 0 || password.length === 0) {
            notify.showError('You must fill all fields.');
            return;
        };

        userModel.signInWithEmailAndPassword(email, password)
            .then((userData) => {
                saveUserData(userData);
                this.redirect('#/home');
            })
            .then(() => {
                notify.showInfo('Login successful.');
            })
            .catch(errorHandler);
    });

    this.get('#/logout', function (context) {
        userModel.signOut()
            .then(response => {
                clearUserData();
                this.redirect('#/login');
            })
            .then(() => {
                notify.showInfo('Logout successful.')
            })
            .catch(errorHandler);
    });

    this.get('#/create', function (context) {
        extendContext(context)
            .then(function () {
                this.partial('./templates/create.hbs');
            });
    });
    this.post('#/create', function (req) {
        const { title, artist, imageURL } = req.params;

        if (artist.length === 0 || title.length === 0 || imageURL.length === 0 ) {
            notify.showError('You must fill all fields.');
            return;
        };

        if ((artist.length < 3)) {
            notify.showError('The artist must be a min 3 charachters.');
            return;
        }

        if (!(imageURL.startsWith('http://') || imageURL.startsWith('https://'))) {
            notify.showError('The image should start with "http://" or "https://".');
            return;
        }

        DB.collection('songs').add({
            artist,
            title,
            imageURL,
            likes: 0,
            listened: 0,
            creator: getUserData().uid,
        })
            .then(() => {
                this.redirect('#/all-song');
            })
            .then(() => {
                notify.showInfo('Song created successfully.')
            })
            .catch(errorHandler);
    });

    this.get('/remove/:songId', function (req) {
        const { songId } = req.params;
        DB.collection('songs')
            .doc(songId)
            .delete()
            .then(() => {
                this.redirect('#/my-song');
            })
            .then(() => {
                notify.showInfo('Song removed successfully!');
            })
            .catch(errorHandler);
    });

    this.get('#/listen/:id', function(context) {
        const { id } = context.params;
        const { uid } = getUserData()
            // console.log(uid);
            // console.log(context.params.id);
            // console.log(getDataUser().uid);

        DB.collection('songs')
            .doc(id)
            .get()
            .then(res => {
                // console.log(res);
                const oData = {...res.data() }
                oData.listened++;

                return DB.collection('songs')
                    .doc(id)
                    .set(oData)
                    .then(() => {
                        console.log(`is sucsess1`);
                        console.log(id);
                        // this.redirect(`#/details/${id}`)
                        this.redirect(`#/my-song`)
                    })
                    .then(() => {
                        notify.showInfo(`You just listened ${oData.title}`)
                })
                .catch(errorHandler);
            })
    });
    this.get('#/like/:id', function(context) {
        const { id } = context.params;
        const { uid } = getUserData()
            // console.log(uid);
            // console.log(context.params.id);
            // console.log(getDataUser().uid);

        DB.collection('songs')
            .doc(id)
            .get()
            .then(res => {
                // console.log(res);
                const oData = {...res.data() }
                oData.likes++;

                return DB.collection('songs')
                    .doc(id)
                    .set(oData)
                    .then(() => {
                        console.log(`is sucsess1`);
                        console.log(id);
                        // this.redirect(`#/details/${id}`)
                        this.redirect(`#/all-song`)
                    })
                    .then(() => {
                        notify.showInfo(`Liked!`)
                })
                .catch(errorHandler);
            })
    });

});

(() => {
    app.run('#/home');
})();

function extendContext(req) {

    let user = getUserData()
    req.isLogged = Boolean(user);
    req.userEmail = user ? user.email : '';

    return req.loadPartials({
        'header': './partials/header.hbs',
        'notifications': './partials/notifications.hbs',
        'footer': './partials/footer.hbs',
    });
}

function errorHandler(error) {
    notify.showError(error.message)
    console.log(error);
}

function saveUserData(data) {
    const { user: { email, uid } } = data;
    localStorage.setItem('user', JSON.stringify({ email, uid }))
}

function getUserData() {
    let user = localStorage.getItem('user');
    return user ? JSON.parse(user) : null;
}

function clearUserData() {
    localStorage.removeItem('user');
}