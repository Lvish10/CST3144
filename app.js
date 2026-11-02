const API_BASE_URL=(location.hostname==='localhost'||location.hostname==='127.0.0.1')?'http://localhost:3000':'https://YOUR-STUDENT-NUMBER-after-school.onrender.com';
const app=Vue.createApp({
data(){return{lessons:[],cart:[],teachers:[],teacherLessons:[],enrolment:{},showCart:false,searchText:'',sortBy:'topic',sortOrder:'asc',selectedTeacherId:'',customerName:'',customerPhone:'',loading:false,submitting:false,errorMessage:'',confirmationMessage:''}},
computed:{
sortedLessons(){return[...this.lessons].sort((a,b)=>{let x=a[this.sortBy],y=b[this.sortBy];if(typeof x==='string'){x=x.toLowerCase();y=y.toLowerCase()}if(x<y)return this.sortOrder==='asc'?-1:1;if(x>y)return this.sortOrder==='asc'?1:-1;return 0})},
validName(){return/^[A-Za-z ]+$/.test(this.customerName)&&this.customerName.length>0},
validPhone(){return/^\d+$/.test(this.customerPhone)&&this.customerPhone.length>0},
canCheckout(){return this.cart.length>0&&this.validName&&this.validPhone},
cartTotal(){return this.cart.reduce((t,i)=>t+Number(i.price),0)},
nameMessage(){return this.customerName?(this.validName?'Valid name':'Use letters and spaces only'):'Enter your name'},
phoneMessage(){return this.customerPhone?(this.validPhone?'Valid phone':'Use numbers only'):'Enter your phone number'}},
methods:{
imageUrl(name){return`${API_BASE_URL}/images/${name}`},
async loadLessons(){this.loading=true;this.errorMessage='';try{const r=await fetch(`${API_BASE_URL}/lessons`);if(!r.ok)throw new Error('Could not load lessons');this.lessons=await r.json()}catch(e){this.errorMessage=e.message}finally{this.loading=false}},
async searchLessons(){if(!this.searchText)return this.loadLessons();this.loading=true;this.errorMessage='';try{const r=await fetch(`${API_BASE_URL}/search?q=${encodeURIComponent(this.searchText)}`);if(!r.ok)throw new Error('Search failed');this.lessons=await r.json()}catch(e){this.errorMessage=e.message}finally{this.loading=false}},
clearSearch(){this.searchText='';this.loadLessons()},
addToCart(lesson){if(lesson.space>0){this.cart.push({...lesson});lesson.space-=1}},
removeFromCart(index){const removed=this.cart[index];const lesson=this.lessons.find(l=>l._id===removed._id);if(lesson)lesson.space+=1;this.cart.splice(index,1);if(!this.cart.length)this.showCart=false},
toggleCart(){if(this.cart.length)this.showCart=!this.showCart},
async loadTeachers(){const r=await fetch(`${API_BASE_URL}/teachers`);if(r.ok)this.teachers=await r.json()},
async loadTeacherLessons(){if(!this.selectedTeacherId){this.teacherLessons=[];return}const r=await fetch(`${API_BASE_URL}/teachers/${this.selectedTeacherId}/lessons`);if(r.ok)this.teacherLessons=await r.json()},
async loadEnrolment(id){const r=await fetch(`${API_BASE_URL}/enrolment/${id}`);if(r.ok){const d=await r.json();this.enrolment[id]=d.enrolment}},
async checkout(){if(!this.canCheckout)return;this.submitting=true;this.errorMessage='';this.confirmationMessage='';try{const counts={};this.cart.forEach(i=>counts[i._id]=(counts[i._id]||0)+1);const order={name:this.customerName,phone:this.customerPhone,lessonIDs:Object.keys(counts),numberOfSpaces:this.cart.length,items:Object.entries(counts).map(([lessonId,quantity])=>({lessonId,quantity}))};const o=await fetch(`${API_BASE_URL}/orders`,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(order)});if(!o.ok)throw new Error('Could not save the order');for(const lessonId of Object.keys(counts)){const lesson=this.lessons.find(l=>l._id===lessonId);const u=await fetch(`${API_BASE_URL}/lessons/${lessonId}`,{method:'PUT',headers:{'Content-Type':'application/json'},body:JSON.stringify({space:lesson.space})});if(!u.ok)throw new Error('Order saved but lesson space update failed')}this.confirmationMessage='Order submitted successfully.';this.cart=[];this.customerName='';this.customerPhone='';await this.loadLessons()}catch(e){this.errorMessage=e.message}finally{this.submitting=false}}},
mounted(){this.loadLessons();this.loadTeachers()}});
app.mount('#app');