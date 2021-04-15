const userModel = firebase.auth();
const DB = firebase.firestore();

const app = Sammy('#container', function () {
    this.use('Handlebars', 'hbs');

    this.get('/home', function (context) {
        DB.collection('destinations')
            .get()
            .then(response => {
                context.destinations = response.docs.map((destination) => { 
                    return { id: destination.id, ...destination.data() } 
                })

                extendContext(context)
                    .then(function () {
                        this.partial('./templates/home.hbs');
                    });
            })
            .catch(errorHandler);
    });

    this.get('/register', function (context) {
        extendContext(context)
            .then(function () {
                this.partial('./templates/register.hbs');
            });
    });
    this.post('/register', function (context) {
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
                this.redirect('/home');
            })
            .then(() => {
                notify.showSuccess('User registration successful.');
            })
            .catch(errorHandler);
    });

    this.get('/login', function (context) {
        extendContext(context)
            .then(function () {
                this.partial('./templates/login.hbs');
            });
    });
    this.post('/login', function (context) {
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
                notify.showSuccess('Login successful.');
            })
            .catch(errorHandler);
    });

    this.get('/logout', function (context) {
        userModel.signOut()
            .then(response => {
                clearUserData();
                this.redirect('#/login');
            })
            .then(() => {
                notify.showSuccess('Logout successful.')
            })
            .catch(errorHandler);
    });

    this.get('/add', function (context) {
        extendContext(context)
            .then(function () {
                this.partial('./templates/add.hbs');
            });
    });
    this.post('/add', function (req) {
        const { destination, city, duration, departureDate, imgUrl } = req.params;

        if (destination.length === 0 || city.length === 0 || duration.length === 0 || departureDate.length === 0 || imgUrl.length === 0) {
            notify.showError('You must fill all fields.');
            return;
        };

        if (!Number(duration)) {
            notify.showError('The duration must be a number.');
            return;
        }

        if (!(imgUrl.startsWith('http://') || imgUrl.startsWith('https://'))) {
            notify.showError('The image should start with "http://" or "https://".');
            return;
        }

        DB.collection('destinations').add({
            destination,
            city,
            duration,
            departureDate,
            imgUrl,
            creator: getUserData().uid,
        })
            .then(() => {
                this.redirect('#/home');
            })
            .then(() => {
                notify.showSuccess('You successfully created a destination.')
            })
            .catch(errorHandler);
    });

    this.get('/details/:destinationId', function (req) {
        const { destinationId } = req.params;

        DB.collection('destinations')
            .doc(destinationId)
            .get()
            .then(response => {
                const { uid } = getUserData();
                const actualDestinationData = response.data();
                const imTheCreator = actualDestinationData.creator === uid;

                req.destination = { ...actualDestinationData, imTheCreator, id: destinationId };
                extendContext(req)
                    .then(function () {
                        this.partial('./templates/details.hbs');
                    });
            });
    });

    this.get('/edit/:destinationId', function (req) {
        const { destinationId } = req.params;

        DB.collection('destinations')
            .doc(destinationId)
            .get()
            .then(response => {
                req.destination = { id: destinationId, ...response.data() };
                extendContext(req)
                    .then(function () {
                        this.partial('./templates/edit.hbs');
                    });
            })
            .catch(errorHandler);
    });
    this.post('/edit/:destinationId', function (req) {
        const { destinationId, destination, city, duration, departureDate, imgUrl } = req.params;

        DB.collection('destinations')
            .doc(destinationId)
            .get()
            .then(res => {
                return DB.collection('destinations')
                    .doc(destinationId)
                    .set({
                        ...res.data(),
                        destination,
                        city,
                        duration,
                        departureDate,
                        imgUrl,
                    })
            })
            .then(() => {
                this.redirect(`#/details/${destinationId}`);
            })
            .then(() => {
                notify.showSuccess('Successfully edited destination.');
            })
            .catch(errorHandler);
    })

    this.get('/my-destinations', function (req) {
        const userId = getUserData().uid;

        DB.collection('destinations')
            .get()
            .then(destinations => {
                req.userDestinations = destinations.docs
                    .filter(destination => destination.data().creator == userId)
                    .map(destination => {
                        return {
                            id: destination.id,
                            ...destination.data()
                        }
                    })

                extendContext(req).then(function () {
                    this.partial('./templates/my-destinations.hbs');
                });
            }).catch(errorHandler);;
    });

    this.get('/remove/:destinationId', function (req) {
        const { destinationId } = req.params;
        DB.collection('destinations')
            .doc(destinationId)
            .delete()
            .then(() => {
                this.redirect('#/my-destinations');
            })
            .then(() => {
                notify.showSuccess('Destination deleted.');
            })
            .catch(errorHandler);
    });
});

(() => {
    app.run('#/home');
})();

function extendContext(req) {

    let user = getUserData()
    req.isLoggedIn = Boolean(user);
    req.userEmail = user ? user.email : '';

    return req.loadPartials({
        'header': './partials/header.hbs',
        'notification': './partials/notification.hbs',
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