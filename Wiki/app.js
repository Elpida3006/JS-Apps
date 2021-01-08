const UserModelAUTH = firebase.auth();
const db = firebase.firestore();


const app = Sammy('#root', function() {

    this.use('Handlebars', 'hbs');

    this.get('#/home', function(context) {

        db.collection('articles')
            .get()
            .then((res) => {

                // context.article = []

                // res.forEach(article => {
                //     context.articles.push({ id: article.id, ...article.data() })
                // });
                db.collection('articles')
                    .get()
                    .then((res) => {

                        const categoryMap = {
                            'JavaScript': 'js',
                            'Pyton': 'python',
                            'C#': 'csharp',
                            'Java': 'java'

                        }
                        const categoryC = {
                            js: [],
                            python: [],
                            csharp: [],
                            java: []

                        }
                        const articleData = res.docs.map(article => {
                            return { id: article.id, ...article.data() }
                        })

                        for (let article of articleData) {

                            // console.log(article.category);
                            // console.log(categoryC[categoryMap[article.category]]);
                            // console.log(article);
                            if (categoryC[categoryMap[article.category]] !== undefined) {
                                categoryC[categoryMap[article.category]].push(article)
                            }

                        }

                        context.articles = categoryC
                        console.log(context.articles);
                    })

                add_Header_Footer(context)
                    .then(function() {
                        this.partial('./templates/home.hbs');
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
            // console.log(hbsView);
        db.collection('articles')
            .doc(id)
            .get()
            .then(res => {
                const articleData = res.data()
                const { uid } = getDataUser()

                const isCreator = articleData.creator === uid ? true : false
                    // const userIndex = offerData.clients.indexOf(uid);
                    // const inBasket = userIndex > -1
                console.log(isCreator);
                context.article = {...res.data(), isCreator, id: id }
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

        db.collection('articles')
            .doc(id)
            .get()
            .then((res) => {
                context.article = { id: id, ...res.data() };
                add_Header_Footer(context)
                    .then(function() {
                        this.partial('./templates/edit.hbs')
                    })
                    // console.log(res.data());
            })
    });


    this.post('#/register', function(context) {
        console.log(context);

        const { email, password, reppass } = context.params
        if (password !== reppass) {
            return;
        }
        UserModelAUTH.createUserWithEmailAndPassword(email, password)
            .then((userData) => {
                console.log(`you are register`);
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
                this.redirect('#/home')
            }).catch((error) => console.log(error))

    });


    this.post('#/create', function(hbsView) {
        // console.log(getDataUser().uid);
        // console.log(JSON.parse(localStorage.getItem('auth')).idToken);
        // console.log(`it's a token`)
        const { title, category, content } = hbsView.params
        console.log(hbsView.params);
        db.collection('articles').add({
            title,
            category,
            content,
            creator: getDataUser().uid,

        }).then((createdPr) => {
            console.log(createdPr);
            this.redirect('#/home')
        }).catch(console.error())
    });


    this.post('#/edit/:id', function(context) {
        const { id, title, category, content } = context.params
        db.collection('articles')
            .doc(id)
            .get()
            .then((res) => {
                // console.log(res.data());
                return db.collection('articles')
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



// this.get('#/buy/:id', function(context) {
// const { id } = context.params;
// const { uid } = getDataUser()
// console.log(uid);
// console.log(context.params.id);
// console.log(getDataUser().uid);

// db.collection('articles')
//     .doc(id)
//     .get()
//     .then(res => {
//         // console.log(res);
//         const oData = {...res.data() }
//         oData.clients.push(uid);

//         return db.collection('articles')
//             .doc(id)
//             .set(oData)
//             .then(() => {
//                 console.log(`is sucsess1`);
//                 console.log(id);
//                 this.redirect(`#/details/${id}`)
//             })
//             .catch(e => console.log(e))
//     })
// });