# Conf Manager

## Description

This class will save / load data into / from JSON file.

## API

### Loading data

#### loadData

Load an array or object of data. Return an array / object of `classType`.

| Parameter | Type   | Additional informations                     |
|-----------|--------|---------------------------------------------|
| classType  | Class | The class where object should be cast. The class MUST implement `json` method |
| key  | String | The key to store object (= the file name) |

Example :

	let c = new confManager(appConfiguration);
	let myUser = c.loadData(User, "user");

### Manipulate data

#### getData

Search the `object` into `datas` using `comparator`. Returns `null` if the object is not found. This method will return the instance in the array. All `object` properties are not mandatory.

This method is equivalent to search.

| Parameter | Type   | Additional informations                     |
|-----------|--------|---------------------------------------------|
| datas  | Array | The array of data retrieved with `loadDatas` |
| object  | Object | The object to search, with properties filled for `comparator` |
| comparator  | Function | The function used to compare objects. This function must have 2 parameters |


Example :

	function comp(user1, user2) {
		return (user1.username === user2.username)?true:false;
	}
	let c = new confManager(appConfiguration);
	let u = new User("foo"); // User can have other properties set in constructor but are not mandatory to look in datas because not requested in comparator
	let d = c.loadDatas(User, "users");
	let myUser = c.getData(d, u, comp);

#### setData

Set a data into an array and save it into json file automatically.

| Parameter | Type   | Additional informations                     |
|-----------|--------|---------------------------------------------|
| datas  | Array | The array of data retrieved with `loadDatas` |
| key  | String | The key to store object (= the file name) |
| object  | Object | The object to search, with properties filled for `comparator` |
| comparator  | Function | The function used to compare objects. This function must have 2 parameters |


Example :

	function comp(user1, user2) {
		return (user1.username === user2.username)?true:false;
	}
	let c = new confManager(appConfiguration);
	let u = new User("foo"); // User can have other properties set in constructor but are not mandatory to look in datas because not requested in comparator
	let d = c.loadDatas(User, "users");
	let myUser = c.setData(d, "users", u, comp);

#### removeData

Remove a data from an array and save it into json file automatically.

Throw a `DATA_NOT_FOUND` error if the data is not found.

| Parameter | Type   | Additional informations                     |
|-----------|--------|---------------------------------------------|
| datas  | Array | The array of data retrieved with `loadDatas` |
| key  | String | The key to store object (= the file name) |
| object  | Object | The object to search, with properties filled for `comparator` |
| comparator  | Function | The function used to compare objects. This function must have 2 parameters |


Example :

	function comp(user1, user2) {
		return (user1.username === user2.username)?true:false;
	}
	let c = new confManager(appConfiguration);
	let u = new User("foo"); // User can have other properties set in constructor but are not mandatory to look in datas because not requested in comparator
	let d = c.loadDatas(User, "users");
	try {
		c.removeData(d, "users", u, comp);
	} catch(e) {
		console.log("Error ! User not found");
	}
