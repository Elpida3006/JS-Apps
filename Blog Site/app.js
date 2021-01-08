const UserModelAUTH = firebase.auth();
const db = firebase.firestore();


const app = Sammy('#root', function() {

    this.use('Handlebars', 'hbs');

    this.get('#/home', function(context) {

        db.collection('posts')
            .get()
            .then((response) => {

                const user = getDataUser();

                context.post = response.docs.map((post) => {
                    if (user) {
                        return {
                            id: post.id,
                            ...post.data(),
                            isCreator: post.data().creator === user.email
                        }
                    }
                });

                console.log(context.post);
                add_Header_Footer(context)
                    .then(function() {
                        this.partial('./templates/home.hbs')
                    })
            })
            .catch(e => console.e)

    })



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
                alert(`You are logging out!`)
                clearUserData();
                this.redirect('#/register')
            }).catch((error) => console.log(error))
    });

    this.get('#/create', function(hbsView) {
        add_Header_Footer(hbsView)
            .then(function() {
                this.partial('./templates/create.hbs')
            });

    });


    this.get('#/details/:id', function(context) {
        const { id } = context.params
        db.collection('posts')
            .doc(id)
            .get()
            .then(res => {
                const articleData = res.data()
                const { uid } = getDataUser()

                const isCreator = articleData.creator === uid ? true : false


                context.post = {...res.data(), isCreator, id: id }
                console.log(context.article);
                add_Header_Footer(context)
                    .then(function() {
                        this.partial('./templates/details.hbs')
                    });
            })


    });

    this.get('#/delete/:id', function(context) {
        const { id } = context.params
            // console.log(id);
        db.collection('articles')
            .doc(id)
            .delete()
            .then(() => this.redirect('#/home'))
            .catch(e => console.log(e));
    });


    this.get('/edit/:id', function(context) {
        const { id } = context.params

        db.collection('posts')
            .doc(id)
            .get()
            .then((res) => {
                context.post = { id: id, ...res.data() };
                add_Header_Footer(context)
                    .then(function() {
                        this.partial('./templates/edit.hbs')
                    })
                    // console.log(res.data());
            })
    });


    this.post('#/register', function(context) {
        console.log(context);

        const { email, password, repeatPassword } = context.params
        if (password !== repeatPassword) {
            alert(`wrong pass`);
            return;
        }
        UserModelAUTH.createUserWithEmailAndPassword(email, password)
            .then((userData) => {
                alert(`you are register`);
                this.redirect('#/login')
            }).catch((error) => console.log(error))
    });

    this.post('#/login', function(context) {
        console.log(context);
        const { email, password } = context.params
        UserModelAUTH.signInWithEmailAndPassword(email, password)
            .then((userData) => {
                saveUserData(userData)
                alert(`You are logged`);
                console.log(userData);
                this.redirect('#/home')
            }).catch((error) => console.log(error))

    });


    this.post('#/create', function(hbsView) {
        // console.log(getDataUser().uid);

        // console.log(`it's a token`)
        const { title, category, content } = hbsView.params
        console.log(hbsView.params);
        db.collection('posts').add({
            title,
            category,
            content,
            creator: getDataUser().uid,

        }).then((createdPost) => {
            console.log(createdPost);
            this.redirect('#/home')
        }).catch(console.error())
    });


    this.post('#/edit/:id', function(context) {
        const { id, title, category, content } = context.params
        db.collection('posts')
            .doc(id)
            .get()
            .then((res) => {
                // console.log(res.data());
                return db.collection('posts')
                    .doc(id)
                    .update({ title, category, content })
            })
            .then((res) => {
                // console.log(creator);
                this.redirect(`#/details/${id}`)

            })
            .catch(e => console.log(e))
    });

    this.get('#/back', function() {
        this.redirect('#/home')
    })

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
    });
}

function saveUserData(data) {
    const { user: { email, uid } } = data
    localStorage.setItem('user', JSON.stringify({ email, uid }))
}

function getDataUser() {
    const user = localStorage.getItem('user')
    return user ? JSON.parse(user) : null
}

function clearUserData() {
    console.log(localStorage);
    localStorage.removeItem('user')
}