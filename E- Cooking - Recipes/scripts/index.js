const userModel = firebase.auth();
const DB = firebase.firestore();

const app = Sammy('#rooter', function () {
    this.use('Handlebars', 'hbs');


    
    this.get('#/home', function (context) {
      
       
        DB.collection('recipes')
            .get()
            .then(response => {
                context.recipes = response.docs.map((recipe) => { 
                    const recipeData = recipe.data()
                    const { uid } = getUserData()
                    const isCreator = recipeData.creator === uid ? true : false
                    return { id: recipe.id, ...recipe.data() , isCreator} 
                })

                extendContext(context)
                    .then(function () {
                        this.partial('./templates/home.hbs');
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
        const { email, password, repeatPassword ,firstName, lastName} = context.params;

        if (email.length === 0 || password.length === 0 || repeatPassword.length === 0 || firstName.length == 0 || lastName.length == 0) {
            notify.showError('You must fill all fields.');
            return;
        };
        const regex = /\S+@\S+\.\S+/
        if (!regex.test(email)) {
            notify.showError('Invalid email.Email have to contains user@domain.com');
            return;
        };
        if ((firstName.length < 2) || (lastName.length < 2)) {
            notify.showError('The firstName and lastName have be at least 2 characters long.');
            return;
        };
        if (password.length < 6) {
            notify.showError('The password must be at least 6 characters long.');
            return;
        };

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
        const { meal, ingredients, prepMethod, description,  foodImageURL ,category} = req.params;

        if (meal.length === 0 || ingredients.length === 0 || prepMethod.length === 0 || description.length === 0 || foodImageURL.length === 0 || category.length === 0 ) {
            notify.showError('You must fill all fields.');
            return;
        };
        if ((meal.length < 4 )) {
            notify.showError('The meal must be a min 3 charachters.');
            return;
        }
        if ((ingredients.split(' ').length < 2 )) {
            notify.showError('The ingredients must be a min 2 charachters.');
            return;
        }
        if ((prepMethod.length < 10 || description.length < 10)) {
            notify.showError('The prepMethod and description must be a min 10 charachters.');
            return;
        }

        if (!(foodImageURL.startsWith('http://') || foodImageURL.startsWith('https://'))) {
            notify.showError('The image should start with "http://" or "https://".');
            return;
        }
const image = {
    'Vegetables and legumes/beans' : 'https://cdn.britannica.com/17/196817-050-6A15DAC3/vegetables.jpg',
    'Fruits' : 'https://www.tialoto.bg/media/files/resized/article/615x348/430/bd67d1f0cfd547d1f55a1a6c850b1430-istock-1132997641.jpg',
    'Grain Food': "https://media1.s-nbcnews.com/i/newscms/2020_22/1574082/whole-grain-bread-te-main2-200528_31a85b6147d40ed7a4484342d81abb90.jpg",
    'Milk, cheese, eggs and alternatives': "https://previews.123rf.com/images/sergioz/sergioz1011/sergioz101100006/8340083-milk-cheese-yogurt-and-eggs-on-a-white-background.jpg",
    'Lean meats and poultry, fish and alternatives': "https://www.gfs.com/sites/default/files/styles/content_article_image/public/MeatPoultryFish_ICHeader.jpg?itok=B2yinlSV"
}
        DB.collection('recipes').add({
            meal,
            ingredients: ingredients.split(', '),
            prepMethod, 
            description,  
            foodImageURL,
            category,
            categoryImageURL: image[category],
            like: 0,
            creator: getUserData().uid,
        })
            .then(() => {
                this.redirect('#/home');
            })
            .then(() => {
                notify.showInfo('Recipe shared successfully!')
            })
            .catch(errorHandler);
    });
    this.get('#/edit/:id', function(context) {
        const { id } = context.params

        DB.collection('recipes')
            .doc(id)
            .get()
            .then((res) => {
                context.recipe = { id: id, ...res.data() };
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

        DB.collection('recipes')
            .doc(id)
            .get()
            .then((res) => {
                const recipeData = res.data()
                const { uid } = getUserData()
                const isCreator = recipeData.creator === uid ? true : false
                context.recipe = { id: id, isCreator, ...res.data() };
                //from here => offer to hbs
                extendContext(context)
                    .then(function() {
                        this.partial('./templates/details.hbs')
                    })
                    .catch(errorHandler);
            })
    });

    this.post('#/edit/:id', function(req) {
        const { id } = req.params
        const { meal, ingredients, prepMethod, description,  foodImageURL ,category} = req.params;
        const image = {
            'Vegetables and legumes/beans' : 'https://cdn.britannica.com/17/196817-050-6A15DAC3/vegetables.jpg',
            'Fruits' : 'https://www.tialoto.bg/media/files/resized/article/615x348/430/bd67d1f0cfd547d1f55a1a6c850b1430-istock-1132997641.jpg',
            'Grain Food': "https://media1.s-nbcnews.com/i/newscms/2020_22/1574082/whole-grain-bread-te-main2-200528_31a85b6147d40ed7a4484342d81abb90.jpg",
            'Milk, cheese, eggs and alternatives': "https://previews.123rf.com/images/sergioz/sergioz1011/sergioz101100006/8340083-milk-cheese-yogurt-and-eggs-on-a-white-background.jpg",
            'Lean meats and poultry, fish and alternatives': "https://www.gfs.com/sites/default/files/styles/content_article_image/public/MeatPoultryFish_ICHeader.jpg?itok=B2yinlSV"
        }
        DB.collection('recipes')
            .doc(id)
            .get()
            .then((res) => {
                // console.log(res.data());
                return DB.collection('recipes')
                    .doc(id)
                    .update({meal,   ingredients: ingredients.split(', '), prepMethod, description,  foodImageURL ,category,  categoryImageURL: image[category],})
            })
            .then((res) => {
                // console.log(creator);
                this.redirect(`#/home`)

            })
            .then(() => {
                notify.showInfo('Recipe edited successfully!')
            })
            .catch(errorHandler);
    });

    this.get('#/archive/:recipeId', function (req) {
        const { recipeId } = req.params;
        DB.collection('recipes')
            .doc(recipeId)
            .delete()
            .then(() => {
                this.redirect('#/home');
            })
            .then(() => {
                notify.showInfo('recipe removed successfully!');
            })
            .catch(errorHandler);
    });

 
    this.get('#/like/:id', function(context) {
        const { id } = context.params;
        const { uid } = getUserData()
            // console.log(uid);
            // console.log(context.params.id);
            // console.log(getDataUser().uid);

        DB.collection('recipes')
            .doc(id)
            .get()
            .then(res => {
                // console.log(res);
                const oData = {...res.data() }
                oData.like++;

                return DB.collection('recipes')
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