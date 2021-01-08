// alert(`it is work`)
const UserModelAUTH = firebase.auth();
const db = firebase.firestore();


const app = Sammy('#root', function() {
    this.use('Handlebars', 'hbs');

    //home
    this.get('#/home', function(context) {
        add_Header_Footer(context)
            .then(function() {
                this.partial('./templates/home.hbs');
            }).catch(e => console.e)
    });
    //dashboard
    this.get('#/dashboard', function(context) {
        db.collection('ideas')
            .get()
            .then((res) => {
                context.ideas = res.docs.map((idea) => { return { id: idea.id, ...idea.data() } })

                add_Header_Footer(context)
                    .then(function() {
                        this.partial('./templates/dashboard.hbs');
                    })
            }).catch(e => console.e)

    });


    //navigation pages - login, register, logout

    //user - GET
    this.get('#/register', function(context) {
        add_Header_Footer(context)
            .then(function() {
                this.partial('./templates/register.hbs')
            })

    });

    this.get('#/login', function(context) {
        add_Header_Footer(context)
            .then(function() {
                this.partial('./templates/login.hbs')
            });

    });

    this.get('#/logout', function() {
        UserModelAUTH.signOut()
            .then((res) => {
                clearUserData();
                this.redirect('#/register')
            }).catch((error) => console.log(error))
    });

    //user - post
    this.post('#/register', function(context) {
        console.log(context);

        const { email, password, repeatPassword } = context.params
        if (password !== repeatPassword) {
            return;
        }
        UserModelAUTH.createUserWithEmailAndPassword(email, password)
            .then((userData) => {
                this.redirect('#/login')
            }).catch((error) => console.log(error))
    });

    this.post('#/login', function(browserRes) {
        console.log(browserRes);
        const { email, password } = browserRes.params
        UserModelAUTH.signInWithEmailAndPassword(email, password)
            .then((userData) => {
                saveUserData(userData)
                console.log(userData);
                this.redirect('#/dashboard')
            }).catch((error) => console.log(error))

    });



    //CRUD - GET
    this.get('#/createIdea', function(hbsView) {
        add_Header_Footer(hbsView)
            .then(function() {
                this.partial('./templates/createIdea.hbs')
            });

    });

    this.get('#/details/:id', function(hbsView) {
        const { id } = hbsView.params
        db.collection('ideas')
            .doc(id)
            .get()
            .then(res => {
                const dinnerData = res.data()
                console.log(dinnerData);
                const { uid } = getDataUser()
                const { email } = getDataUser()
                console.log(uid);
                console.log(email);
                const isCreator = dinnerData.creator === uid ? true : false
                const iLiked = dinnerData.liked == uid ? true : false


                // hbsView.offer = {...res.data(), isCreator, id: id, inBasket }
                const likesCount = dinnerData.likes.length;
                hbsView.idea = {...res.data(), isCreator, id: id, likesCount, iLiked }
                add_Header_Footer(hbsView)
                    .then(function() {
                        this.partial('./templates/details.hbs')
                    });
            })
    })

    this.get('#/delete/:id', function(context) {
        const { id } = context.params
            // console.log(id);
        db.collection('ideas')
            .doc(id)
            .delete()
            .then(() => this.redirect('#/dashboard'))
            .catch(e => console.log(e));
    });



    //CRUD- POST
    this.post('#/createIdea', function(hbsView) {
        // console.log(getDataUser().uid);
        // console.log(JSON.parse(localStorage.getItem('auth')).idToken);
        // console.log(`it's a token`)
        const { title, description, imageURL } = hbsView.params
            // console.log(hbsView.params);
        db.collection('ideas').add({
            title,
            description,
            imageURL,

            creator: getDataUser().uid,
            likes: [],
            comments: []
        }).then((createdPr) => {
            console.log(createdPr);
            this.redirect('#/dashboard')
        }).catch(console.error())
    });

    this.get('#/likes/:id', function(context) {
        const { id } = context.params;
        const { email } = getDataUser();

        db.collection('ideas')
            .doc(id)
            .get()
            .then((res) => {
                const ideasData = {...res.data() };

                if (!ideasData.likes.includes(email)) {
                    ideasData.likes.push(email);

                    return db.collection('ideas')
                        .doc(id)
                        .set(ideasData)
                }
            })
            .then(() => {
                this.redirect(`#/details/${id}`);
            }).catch(console.error);
    });

    this.get('#/comments/:id', function(context) {
        const { id, newComment } = context.params;
        console.log(newComment);
        const { email } = getDataUser();

        db.collection('ideas')
            .doc(id)
            .get()
            .then((response) => {
                const ideasData = {...response.data() };

                if (!ideasData.comments.some(comment => comment.email === email && comment.comment === newComment)) {

                    ideasData.comments.push({ email: email, comment: newComment });

                    return db.collection('ideas')
                        .doc(id)
                        .set(ideasData)
                }
            })
            .then(() => {
                this.redirect(`#/details/${id}`);
            })
            .catch(console.error);
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
        'navigation': './partials/navigation.hbs',
        'footer': './partials/footer.hbs',
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