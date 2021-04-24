// Imported modules
const Joi =require("joi");
const express= require("express");
const firebase= require("firebase/app");

const firebase_auth= require("firebase/auth");
const firestore= require("firebase/firestore");


const app=express();
app.use(express.json());

// firebase configuration details
const firebaseConfig = {
	apiKey: "AIzaSyDcgUSLijFPnKFXhYIg1VMaOM4IRKDN8Gg",
	authDomain: "fir-c6f96.firebaseapp.com",
	databaseURL: "https://fir-c6f96-default-rtdb.firebaseio.com",
	projectId: "fir-c6f96",
	storageBucket: "fir-c6f96.appspot.com",
	messagingSenderId: "982597030071",
	appId: "1:982597030071:web:fb0c5dcf01672bb9ecbd32",
	measurementId: "G-9RJF6QSCEQ"
};


firebase.initializeApp(firebaseConfig);

const db = firebase.firestore(); 




 
//--------------------------------------------

// catorgory collection main ===
const catCollection= db.collection("category");

// add a initialise collection
initialiseCollection(catCollection,(result)=>{});



// --------------------POST------------------

app.post("/api/addCat/:catName",(req,res)=>{
	let cat_name=req.params.catName;
	if(cat_name.length<=3){
		console.log(_ERROR.length);
		res.status(400).send(_ERROR.length);
		return;
	}

	let col_obj=catCollection.doc(cat_name).collection(cat_name);


	initialiseCollection(col_obj,(result)=>{

		console.log(result);

		if(result==1){

			catCollection.doc(cat_name).set({
				data:"dummy"
			},{merge: true});

			res.status(201).send(`New collection ${cat_name} created`);

		}
		else if(result==-1){
			res.status(500).send(`Error creating collection`);
		}
		else{
			res.status(409).send(`Collection already exits`);
		}
	});

	
});


//add item to a collection
app.post("/api/item/:catName",(req,res)=>{

	let cat_name=req.params.catName;
	

	//validate new item data
	const result=validateItem(req.body);

	if(result){
		console.log(result.message);
		res.status(400).send(result.message);
		return;
	}

	
	// validate collection
	let coll_obj=catCollection.doc(cat_name).collection(cat_name);
	checkColExists(coll_obj,(col_size)=>{


		if(!col_size){
			res.status(400).send(`specified catorgory does not exist`);
			return;
		}
		

		coll_obj.add({

			id: col_size,
			product_name: req.body.product_name,
			description:  req.body.description,
			price: req.body.price,
			offers: req.body.offers,
			in_stock: req.body.in_stock,
			features: req.body.features
		})
		.then((docRef)=>{

			review_collection=coll_obj.doc(docRef.id)
								.collection("reviews");

			initialiseCollection(review_collection,()=>{});

			console.log("item added sucessfully");

			res.send(`item ${req.body.product_name} added sucessfully`);
		})
		.catch((error)=>{
			console.log("Error adding a new item");
		});

		

	});


});

// adds review 
app.post("/api/review/:catName/:itemDocId",(req,res)=>{

	let cat_name=req.params.catName;
	let item_id= req.params.itemDocId;		

	// validate new item data
	const result=validateReview(req.body);

	if(result){
		console.log(result.message);
		res.status(400).send(result.message);
		return;
	}

	
	// validate collection
	let coll_obj=catCollection.doc(cat_name).collection(cat_name);

	checkColExists(coll_obj,(col_size)=>{


		if(!col_size){
			res.status(400).send(`specified catorgory does not exist`);
			return;
		}
		
		const itemRef = coll_obj.doc(item_id);

		// checking if the document exits or not
		itemRef.get()
		  .then((docSnapshot) => {
			if (docSnapshot.exists) {
			  		
				const review_col=itemRef.collection("reviews");
				console.log(req.body.author);
				review_col.add({

					author: req.body.author,
					rating: req.body.rating,
					verified: req.body.verified,
					comment: req.body.comment

				}).then((docRef)=>{

				console.log("review added sucessfully");

				res.send(`review added sucessfully`);
				})
				.catch((error)=>{
					console.log("Error adding review");
					res.status(500).send("internal error in adding review");
				});

			} else {
			  res.status(404).send("document with specified id does not exist");
			}
		});
	
	});

});


// put 3d model file & images in a item
app.post("/api/files/:catName/:itemDocId",(req,res)=>{

	let cat_name=req.params.catName;
	let item_id= req.params.itemDocId;		

	// validate new item data
	const result=validateFile(req.body);

	if(result){
		console.log(result.message);
		res.status(400).send(result.message);
		return;
	}

	
	// validate collection
	let coll_obj=catCollection.doc(cat_name).collection(cat_name);

	checkColExists(coll_obj,(col_size)=>{


		if(!col_size){
			res.status(400).send(`specified catorgory does not exist`);
			return;
		}
		
		const itemRef = coll_obj.doc(item_id);

		// checking if the document exits or not
		itemRef.get()
		  .then((docSnapshot) => {
			if (docSnapshot.exists) {
			  		
				itemRef.update({
					model : req.body.model,
					images: req.body.images
				});
				res.send("files uploaded sucessfully");

			} else {
			  res.status(404).send("document with specified id does not exist");
			}
		});
	
	});



});




// ------------GET-----------------

app.get("/api/categories",(req,res)=>{

	let result=[];

	catCollection
	.get().then((querSnapshot) => {

		querSnapshot.forEach((doc)=>{
			if(doc.id!="dummy"){
				console.log(doc.id);
				result.push(doc.id);
			}
		})

		res.send(result)
	})
	.catch((error)=>{
		console.log("error getting data : ",error);
		res.status(404).send("no data found");
	});


});

// get all items in a catogory
app.get("/api/items/:catName",(req,res)=>{

	let result=[];
	let cat_name=req.params.catName;

	let coll_obj=catCollection.doc(cat_name).collection(cat_name);

	checkColExists(coll_obj,(col_size)=>{

			if(!col_size){
				res.status(400).send(`specified catorgory does not exist`);
				return;
			}


			coll_obj
			.get().then((querSnapshot) => {

				querSnapshot.forEach((doc)=>{
					if(doc.id!="dummy"){
						let d_data=doc.data();
						d_data["doc_id"]=doc.id;
						result.push(d_data);
					}
				})

				res.send(result)
			})
			.catch((error)=>{
				console.log("error getting data : ",error);
				res.status(404).send("no data found");
			});

		});

});



// get item of specified id in a specified category
app.get("/api/item/:catName/:itemid",(req,res)=>{

	let result=null;
	let cat_name=req.params.catName;
	let item_id=req.params.itemid;

	let coll_obj=catCollection.doc(cat_name).collection(cat_name);

	checkColExists(coll_obj,(col_size)=>{

			if(!col_size){
				res.status(400).send(`specified catorgory does not exist`);
				return;
			}

			// get item with doc id
			coll_obj.doc(item_id)
			.get().then((doc) => {

				if(doc.exists){
					result=doc.data();
					result["doc_id"]=doc.id;
					res.send(result);
				}else{
					res.status(404).send("item does not exists");
				}
				
			})
			.catch((error)=>{
				console.log("error getting data : ",error);
				res.status(404).send("no data found");
			});

		});

});


// get item of specified id in a specified category
app.get("/api/reviews/:catName/:itemid",(req,res)=>{

	let result=[];
	let cat_name=req.params.catName;
	let item_id=req.params.itemid;

	let coll_obj=catCollection.doc(cat_name).collection(cat_name);

	checkColExists(coll_obj,(col_size)=>{

			if(!col_size){
				res.status(400).send(`specified catorgory does not exist`);
				return;
			}


			coll_obj.doc(item_id)
			.get().then((doc) => {

				if(doc.exists){
					// if doc exists send all reviews
					coll_obj.doc(item_id)
					.collection("reviews").get().
					then((querSnapshot) => {


					querSnapshot.forEach((doc)=>{
						if(doc.id!="dummy"){
							let d_data=doc.data();
							d_data["doc_id"]=doc.id;
							result.push(d_data);
						}
						})

						res.send(result)
						});

				}else{
					res.status(404).send("item does not exists");
				}
				
			})
			.catch((error)=>{
				console.log("error getting data : ",error);
				res.status(404).send("no data found");
			});

		});

});


//------PUT-----------------------

// update the item data
app.put("/api/item/:catName/:itemDocId",(req,res)=>{

	let cat_name=req.params.catName;
	let item_id= req.params.itemDocId;		

	// validate new item data
	const result=validateUpdateItem(req.body);

	if(result){
		console.log(result.message);
		res.status(400).send(result.message);
		return;
	}

	
	// validate collection
	let coll_obj=catCollection.doc(cat_name).collection(cat_name);

	checkColExists(coll_obj,(col_size)=>{


		if(!col_size){
			res.status(400).send(`specified catorgory does not exist`);
			return;
		}
		
		const itemRef = coll_obj.doc(item_id);

		// checking if the document exits or not
		itemRef.get()
		  .then((docSnapshot) => {
			if (docSnapshot.exists) {
			  		
				itemRef.update({
					offers: req.body.offers,
					product_name: req.body.product_name,
					decription: req.body.description,
					price: req.body.price,
					features: req.body.features,
					in_stock: req.body.in_stock,
					model : req.body.model,
					images: req.body.images
				});
				res.send("item updates sucessfully sucessfully");

			} else {
			  res.status(404).send("document with specified id does not exist");
			}
		});
	
	});



});

// DELETE------------------

app.delete("/api/item/:catName/:itemDocId",(req,res)=>{

	let cat_name=req.params.catName;
	let item_id= req.params.itemDocId;		

	let coll_obj=catCollection.doc(cat_name).collection(cat_name);

	checkColExists(coll_obj,(col_size)=>{


		if(!col_size){
			res.status(400).send(`specified catorgory does not exist`);
			return;
		}
		
		const itemRef = coll_obj.doc(item_id);

		// checking if the document exits or not
		itemRef.get()
		  .then((docSnapshot) => {
			if (docSnapshot.exists) {
			  		
				itemRef.delete();
				res.send("item deleted sucessfully sucessfully");

			} else {
			  res.status(404).send("document with specified id does not exist");
			}
		});
	
	});



});




// functions ---------------

function initialiseCollection(coll_obj,callback){

	coll_obj.get().then( ids => {
	
	if(ids.docs.length==0){


		coll_obj.doc("dummy").set({
			info: "dummy data" })
			.then(
			(docRef)=> {
				console.log("collection has been created");
				callback(1);
				
			}).catch((err)=>{
				console.error("error creating collection");
				callback(-1);
		});
	}
	else{
		callback(0); // collection exits
	}

	});
}

// checks whether a collection exists or not
function checkColExists(coll_obj,callback){

	coll_obj.get().then( ids => {

		callback(ids.docs.length);
	});

}

function validateItem(item){

	const schema=Joi.object({
		product_name: Joi.string().min(3).required(),
		description: Joi.string().min(3).required(),
		price: Joi.number().required(),
		offers: Joi.required(),
		in_stock: Joi.boolean().required(),
		features: Joi.required()

	})
	const {error}=schema.validate(item); /// == result.error
	return error;
}

function validateReview(item){

	const schema=Joi.object({
		author: Joi.string().min(3).required(),
		comment: Joi.string().min(3).required(),
		
		rating: Joi.number().required(),
		verified: Joi.boolean().required()

	})
	const {error}=schema.validate(item); /// == result.error
	return error;
}

function validateFile(item){

	const schema=Joi.object({
		images: Joi.required(),
		model: Joi.required(),

	
	})
	const {error}=schema.validate(item); /// == result.error
	return error;
}


function validateUpdateItem(item){

	const schema=Joi.object({
		images: Joi.required(),
		model: Joi.required(),
		product_name: Joi.string().min(3).required(),
		description: Joi.string().min(3).required(),
		price: Joi.number().required(),
		offers: Joi.required(),
		in_stock: Joi.boolean().required(),
		features: Joi.required()
	
	})
	const {error}=schema.validate(item); /// == result.error
	return error;
}



// Error hadling==
const _ERROR ={

	"length" : "length of the string must be atleast 3",	


}



// serving station ==

// PORT
const port = process.env.PORT || 3000;
app.listen(port, ()=>{
	console.log(`listening on port ${port}`);
});