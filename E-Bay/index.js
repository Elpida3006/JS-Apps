console.log(123)
const UserModelAUTH = firebase.auth();
const db = firebase.firestore();


const app = Sammy('#root', function() {

    this.use('Handlebars', 'hbs');

    this.get('#/home', function(context) {

      
                add_Header_Footer(context)
                    .then(function() {
                        this.partial('./templates/home.hbs');
                    })     
    });
    

    //user - GET
    this.get('#/dashboard', function(context) {

        db.collection('offers')
        .get()
        .then((res) => {
            let index = 0;
            context.offers = res.docs.map((offer) => { 
                const offerData = offer.data()
                index++;
            const { uid } = getDataUser()
            const isCreator = offerData.creator === uid ? true : false
            const isBuyer = offerData.clients.map(x => x === uid ? true : false )
                return { index, id: offer.id, ...offer.data() , isCreator, isBuyer} })
                //docs - obhojdame bazata, taka ni vadi id-to i vsichki propyrtita koito sme sazdali v bazata s tova ( data)

            add_Header_Footer(context)
                .then(function() {
                    this.partial('./templates/dashboard.hbs');
                })

        }).catch(e => console.e)
    

    });
    this.get('#/register', function(hbsView) {
        add_Header_Footer(hbsView)
            .then(function() {
                this.partial('./templates/register.hbs')
            })

    });

    this.get('#/login', function(hbsView) {
        add_Header_Footer(hbsView)
            .then(function() {
                this.partial('./templates/login.hbs')
            });

    });

    this.get('#/logout', function(hbsView) {
        UserModelAUTH.signOut()
            .then((res) => {
                clearUserData();
                this.redirect('#/register')
            })
            .then(() => {
                notify.showSuccess('Logout successful.')
            })
            .catch(errorHandler);    });

    //user - post
    this.post('#/register', function(context) {
        console.log(context);

        const { email, password, repassword } = context.params
        if (email.length === 0 || password.length === 0 || repassword.length === 0) {
            notify.showError('You must fill all fields.');
            return;
        };
        const regex = /\S+@\S+\.\S+/
        if (!regex.test(email)) {
            notify.showError('Invalid email.Email have to contains user@domain.com');
            return;
        };

        if (password.length < 6) {
            notify.showError('The password must be at least 6 characters long.');
            return;
        };

        if (password !== repassword) {
            notify.showError('The passwords do not match!');
            return;
        };
        UserModelAUTH.createUserWithEmailAndPassword(email, password)
            .then((userData) => {
                this.redirect('#/login')
            })
            .then(() => {
                notify.showSuccess('User registration successful.');
            })
            .catch(errorHandler);
    });

    this.post('#/login', function(browserRes) {
        console.log(browserRes);
        const { email, password } = browserRes.params
        if (email.length === 0 || password.length === 0) {
            notify.showError('You must fill all fields.');
            return;
        };
        UserModelAUTH.signInWithEmailAndPassword(email, password)
            .then((userData) => {
                saveUserData(userData)
                console.log(userData);
                this.redirect('#/home')
            })
            .then(() => {
                notify.showSuccess('Login successful.');
            })
            .catch(errorHandler);

    });

    //CRUD - GET
    this.get('#/create', function(hbsView) {
        add_Header_Footer(hbsView)
            .then(function() {
                this.partial('./templates/create.hbs')
            });

    });

    this.get('/edit/:id', function(context) {
        const { id } = context.params

        db.collection('offers')
            .doc(id)
            .get()
            .then((res) => {
                context.offer = { id: id, ...res.data() };
                //from here => offer to hbs
                add_Header_Footer(context)
                    .then(function() {
                        this.partial('./templates/edit.hbs')
                    })
                    // console.log(res.data());
            })
    });


    this.get('#/delete/:id', function(context) {
        const { id } = context.params
            // console.log(id);
        db.collection('offers')
            .doc(id)
            .delete()
            .then(() => this.redirect('#/home'))
            .then(() => {
                notify.showSuccess('Offers deleted.');
            })
            .catch(errorHandler);
    });

    this.get('#/details/:id', function(hbsView) {
        const { id } = hbsView.params
            // console.log(hbsView);
        db.collection('offers')
            .doc(id)
            .get()
            .then(res => {
            
                hbsView.offer = {...res.data(), id: id }
                  //from here => offer to hbs
                add_Header_Footer(hbsView)
                    .then(function() {
                        this.partial('./templates/details.hbs')
                    });
            })


    });
    this.get('#/profile', function(context) {
        const { uid } = getDataUser()
      let boughtOffers = 0;

        db.collection('users')
            .doc(uid)
            .get()
            .then((res) => {
                context.user = { boughtOffers, uid: uid, ...res.data() };
                //from here => offer to hbs

                db.collection('offers')
                .get()
                .then(offers => { 
                    context.offers =  offers.docs.
                filter(offer => {
                offer.data().clients.map(userId => {
                    userId == uid ? boughtOffers++ : null;
                    console.log(boughtOffers);
                    return boughtOffers;
                });
             })   
             console.log(boughtOffers);
            return {boughtOffers,  id: uid, ...res.data()};
             })
            
                add_Header_Footer(context)
                    .then(function() {
                        this.partial('./templates/profile.hbs')
                    })
                    // console.log(res.data());
        });
    
    });


    //CRUD- POST

    this.post('#/create', function(hbsView) {
        // console.log(getDataUser().uid);
        // console.log(JSON.parse(localStorage.getItem('auth')).idToken);
        // console.log(`it's a token`)
        const { product, price, pictureUrl, description } = hbsView.params
        if (description.length === 0 || product.length === 0 || price.length === 0 || pictureUrl.length === 0 ) {
            notify.showError('You must fill all fields.');
            return;
        };

        if (!Number(price)) {
            notify.showError('The price must be a number.');
            return;
        }

        if (!(pictureUrl.startsWith('http://') || pictureUrl.startsWith('https://'))) {
            notify.showError('The image should start with "http://" or "https://".');
            return;
        }

            // console.log(hbsView.params);
        db.collection('offers').add({
            product,
            price,
            pictureUrl,
            description,
            creator: getDataUser().uid,
            clients: []
        }).then((createdPr) => {
            console.log(createdPr);
            this.redirect('#/dashboard')
        })
        .then(() => {
                notify.showSuccess('You successfully created a destination.')
        })
        .catch(errorHandler);
    });


    this.post('#/edit/:id', function(context) {
        const { id, product, pictureUrl, description, price } = context.params
        db.collection('offers')
            .doc(id)
            .get()
            .then((res) => {
                // console.log(res.data());
                return db.collection('offers')
                    .doc(id)
                    .update({  product, pictureUrl, description, price })
            })
            .then((res) => {
                // console.log(creator);
                this.redirect(`#/details/${id}`)

            })
            .catch(e => console.log(e))
    });


    this.get('#/buy/:id', function(context) {
        const { id } = context.params;
        const { uid } = getDataUser()
            // console.log(uid);
            // console.log(context.params.id);
            // console.log(getDataUser().uid);

        db.collection('offers')
            .doc(id)
            .get()
            .then(res => {
                // console.log(res);
                const oData = {...res.data() }
                oData.clients.push(uid);

                return db.collection('offers')
                    .doc(id)
                    .set(oData)
                    .then(() => {
                        console.log(`is sucsess1`);
                        console.log(id);
                        // this.redirect(`#/details/${id}`)
                        this.redirect(`#/dashboard`)
                    })
                    .then(() => {
                        notify.showSuccess('You successfully Buy a product.')
                })
                .catch(errorHandler);
            })
    });
});


(() => {
    app.run('#/home');
})()

function add_Header_Footer(context) {
    const user = getDataUser();

    context.isLoggedIn = Boolean(user);
    context.email = user ? user.email : '';

    return context.loadPartials({
        'header': './partials/header.hbs',
        'footer': './partials/footer.hbs',
        'notifications': './partials/notifications.hbs',

    });
}

function saveUserData(data) {
    const { user: { email, uid } } = data
    localStorage.setItem('user', JSON.stringify({ email, uid }))
}

function getDataUser() {
    const user = localStorage.getItem('user')
    return user ? JSON.parse(user) : null
        //const token = JSON.parse(localStorage.getItem('auth')).idToken
}

function clearUserData() {
    console.log(localStorage);
    localStorage.removeItem('user')
}