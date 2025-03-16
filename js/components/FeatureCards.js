const features = [
    { icon: "fas fa-cube", title: "Advanced 3D Scanning", desc: "High-quality 3D models with Gaussian splatting." },
    { icon: "fas fa-mobile-alt", title: "User-Friendly", desc: "Intuitive interface for seamless scanning." },
    { icon: "fas fa-chart-line", title: "High Impact", desc: "Boost engagement with interactive displays." }
];

const FeatureCard = ({ feature, index }) => {
    const colors = ['#e74052', '#78c3af', '#f3b062'];
    return React.createElement('div', {
        className: "p-8 glass-effect rounded-lg shadow-lg hover:scale-105 transition flex flex-col items-center text-center h-full"
    }, [
        React.createElement('i', {
            className: `${feature.icon} text-5xl mb-6 drop-shadow-md`,
            style: { color: colors[index % colors.length] },
            key: 'icon'
        }),
        React.createElement('h3', {
            className: "text-2xl font-semibold mb-3 text-white drop-shadow-sm",
            key: 'title'
        }, feature.title),
        React.createElement('p', {
            className: "text-base text-gray-100 drop-shadow-sm",
            key: 'desc'
        }, feature.desc)
    ]);
};

export const FeatureList = () => {
    return React.createElement('div', {
        className: "grid grid-cols-1 md:grid-cols-3 gap-8 w-full"
    }, features.map((feature, index) => 
        React.createElement(FeatureCard, {
            feature,
            index,
            key: index
        })
    ));
};