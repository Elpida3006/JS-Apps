const userModel = firebase.auth();
const DB = firebase.firestore();
console.log(123)

const app = Sammy('#rooter', function () {
    this.use('Handlebars', 'hbs');


    
    this.get('#/home', function (context) {
      
       
        DB.collection('pets')
            .get()
            .then(response => {
                context.pets = response.docs.map((pet) => { 
                    const petData = pet.data()
                    // const { uid } = getUserData()
                    // const isCreator = petData.creator === uid ? true : false
                    // return { id: pet.id, ...pet.data() , isCreator} 
                    return { id: pet.id, ...pet.data()} 
                })

                extendContext(context)
                    .then(function () {
                        this.partial('./templates/home.hbs');
                    });
            })
            .catch(errorHandler);
    });

    this.get('#/my-pets', function (req) {
        const userId = getUserData().uid;
       
        DB.collection('pets')
            .get()
            .then(response => {
                req.userPets = response.docs
                .filter(pet => pet.data().creator == userId)
                .map(pet => {
                    return {
                        id: pet.id,
                        ...pet.data()
                    }
                })
                extendContext(req)
                    .then(function () {
                        this.partial('./templates/my-pets.hbs');
                    });
            })
            .catch(errorHandler);
    });

    this.get('#/register', function (context) {
        extendContext(context)
            .then(function () {
                this.partial('./templates/register.hbs');
            });
    });
    this.post('#/register', function (context) {
        const { email, password, repeatPassword } = context.params;

        if (email.length === 0 || password.length === 0 || repeatPassword.length === 0 ) {
            notify.showError('You must fill all fields.');
            return;
        };
        const regex = /\S+@\S+\.\S+/
        if (!regex.test(email)) {
            notify.showError('Invalid email.Email have to contains user@domain.com');
            return;
        };
       
        // if (password.length < 6) {
        //     notify.showError('The password must be at least 6 characters long.');
        //     return;
        // };

        if (password !== repeatPassword) {
            notify.showError('The passwords do not match!');
            return;
        };

        userModel.createUserWithEmailAndPassword(email, password)
            .then((userData) => {
                console.log(userData);
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
        const { name, description, imageUrl, type} = req.params;

        if (name.length === 0 || description.length === 0 || imageUrl.length === 0 || type.length === 0 ) {
            notify.showError('You must fill all fields.');
            return;
        };
    

        if (!(imageUrl.startsWith('http://') || imageUrl.startsWith('https://'))) {
            notify.showError('The image should start with "http://" or "https://".');
            return;
        }

        DB.collection('pets').add({
            name, 
            description, 
            imageUrl, 
            type,         
            like: 0,
            creator: getUserData().uid,
        })
            .then(() => {
                this.redirect('#/home');
            })
            .then(() => {
                notify.showInfo('Pets created successfully!')
            })
            .catch(errorHandler);
    });
    this.get('#/edit/:id', function(context) {
        const { id } = context.params

        DB.collection('pets')
            .doc(id)
            .get()
            .then((res) => {
                context.pet = { id: id, ...res.data() };
                //from here => offer to hbs
                extendContext(context)
                    .then(function() {
                        this.partial('./templates/edit.hbs')
                    })
                    .catch(errorHandler);
            })
    });
    this.get('#/details/:id', function(context) {
        const { id } = context.params

        DB.collection('pets')
            .doc(id)
            .get()
            .then((res) => {
                const petData = res.data()
                // const { uid } = ( getUserData() !== null) ? true : false;
                console.log(getUserData());
                if(getUserData() !== null) {
                    const { uid } = getUserData()
                    const isCreator = petData.creator === uid ? true : false
                    const isLogged = true;
                   
                    context.pet = { id: id, isCreator, isLogged, ...res.data() };
                    extendContext(context)
                    .then(function() {
                        this.partial('./templates/details.hbs')
                    })
                    .catch(errorHandler);
                 
                } else {
                    const isCreator = false;
                    const isLogged = false;
                    context.pet = { id: id, isCreator, isLogged, ...res.data() };
                    //from here => cat to hbs
                    extendContext(context)
                    .then(function() {
                        this.partial('./templates/details.hbs')
                    })
                    .catch(errorHandler);
                
                }
            
              
            })
    });

    this.post('#/edit/:id', function(req) {
        const { id } = req.params
        const {name, type, description,  imageUrl } = req.params;

        DB.collection('pets')
            .doc(id)
            .get()
            .then((res) => {
                // console.log(res.data());
                return DB.collection('pets')
                    .doc(id)
                    .update({name, type, description,  imageUrl })
            })
            .then((res) => {
                // console.log(creator);
                this.redirect(`#/home`)

            })
            .then(() => {
                notify.showInfo('Pet edited successfully!')
            })
            .catch(errorHandler);
    });

    this.get('#/delete/:petId', function (req) {
        const { petId } = req.params;
        DB.collection('pets')
            .doc(petId)
            .delete()
            .then(() => {
                this.redirect('#/home');
            })
            .then(() => {
                notify.showInfo('Pet removed successfully!');
            })
            .catch(errorHandler);
    });

 
    this.get('#/like/:id', function(context) {
        const { id } = context.params;
        const { uid } = getUserData()
            // console.log(uid);
            // console.log(context.params.id);
            // console.log(getDataUser().uid);

        DB.collection('pets')
            .doc(id)
            .get()
            .then(res => {
                // console.log(res);
                const oData = {...res.data() }
                oData.like++;

                return DB.collection('pets')
                    .doc(id)
                    .set(oData)
                    .then(() => {
                        console.log(`is sucsess1`);
                        console.log(id);
                        // this.redirect(`#/details/${id}`)
                        this.redirect(`#/home`)
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