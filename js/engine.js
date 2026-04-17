export class QuizEngine {
    constructor(questions, userAnswers, settings) {
        this.questions = questions;
        this.userAnswers = userAnswers;
        this.settings = settings;
        this.currentList = [];
        this.isExamMode = false;
        this.examTimer = null;
        this.examTimeLeft = 0;
    }

    getFilteredQuestions(filter, topic) {
        let filtered = [...this.questions];

        if (topic !== 'all') {
            filtered = filtered.filter(q => q.topic === topic);
        }

        switch (filter) {
            case 'pending':
                filtered = filtered.filter(q => !this.userAnswers[q.id]);
                break;
            case 'correct':
                filtered = filtered.filter(q => this.userAnswers[q.id] === q.correct);
                break;
            case 'incorrect':
                filtered = filtered.filter(q => this.userAnswers[q.id] && this.userAnswers[q.id] !== q.correct);
                break;
        }

        return filtered;
    }

    startExam(config) {
        this.isExamMode = true;
        let pool = [...this.questions];

        // Filter by topics
        if (!config.topics.includes('all')) {
            pool = pool.filter(q => config.topics.includes(q.topic));
        }

        // Shuffle and slice
        pool = this.shuffle(pool);
        const count = config.count === 'all' ? pool.length : parseInt(config.count);
        this.currentList = pool.slice(0, count);

        // Timer
        if (config.time !== 'unlimited') {
            this.examTimeLeft = parseInt(config.time) * 60;
        } else {
            this.examTimeLeft = -1;
        }

        return this.currentList;
    }

    stopExam() {
        this.isExamMode = false;
        if (this.examTimer) clearInterval(this.examTimer);
    }

    shuffle(array) {
        const newArr = [...array];
        for (let i = newArr.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [newArr[i], newArr[j]] = [newArr[j], newArr[i]];
        }
        return newArr;
    }

    calculateStats() {
        const total = this.questions.length;
        const answeredIds = Object.keys(this.userAnswers);
        const answered = answeredIds.length;
        
        let correct = 0;
        let incorrect = 0;

        answeredIds.forEach(id => {
            const q = this.questions.find(q => q.id == id);
            if (q) {
                if (this.userAnswers[id] === q.correct) correct++;
                else incorrect++;
            }
        });

        return {
            total,
            answered,
            correct,
            incorrect,
            pending: total - answered,
            score: answered > 0 ? Math.round((correct / answered) * 100) : 0,
            progress: Math.round((answered / total) * 100)
        };
    }

    getTopicStats() {
        const topics = [...new Set(this.questions.map(q => q.topic))];
        const stats = topics.map(topic => {
            const topicQs = this.questions.filter(q => q.topic === topic);
            const answeredInTopic = topicQs.filter(q => this.userAnswers[q.id]);
            const correctInTopic = answeredInTopic.filter(q => this.userAnswers[q.id] === q.correct);
            
            return {
                name: topic,
                total: topicQs.length,
                progress: Math.round((answeredInTopic.length / topicQs.length) * 100) || 0,
                score: answeredInTopic.length > 0 ? Math.round((correctInTopic.length / answeredInTopic.length) * 100) : 0
            };
        });
        return stats;
    }
}
