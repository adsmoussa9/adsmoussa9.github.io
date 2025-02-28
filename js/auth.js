// Authentication module
class AuthManager {
    constructor(database) {
        this.db = database;
        this.currentUser = null;
        this.userType = null;
    }
    
    login(username, password, userType) {
        const user = this.db.users[userType];
        
        if (user && user.username === username && user.password === password) {
            this.currentUser = username;
            this.userType = userType;
            return true;
        }
        
        return false;
    }
    
    logout() {
        this.currentUser = null;
        this.userType = null;
    }
    
    isLoggedIn() {
        return this.currentUser !== null;
    }
    
    isDoctor() {
        return this.userType === 'doctor';
    }
    
    isSecretary() {
        return this.userType === 'secretary';
    }
    
    changePassword(userType, newPassword) {
        return this.db.updateUserPassword(userType, newPassword);
    }
}

// Create an instance of AuthManager
const authManager = new AuthManager(db);

