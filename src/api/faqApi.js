import api from "./axios";

export const faqApi = {
    faqList:async()=>{
        const response = await api.get('/faq/questionList');
        console.log(response);
        return response.data;
    }
    
};