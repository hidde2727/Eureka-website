import { useEffect, useState } from "react";

import { useInspirationLabelsSus } from "../../utils/data_fetching";
import { Checkbox } from "../../components/inputs";

export default function Sidebar({ sidebar }) {
    const { labels, isFetching, hasError } = useInspirationLabelsSus();
    const amountCategories = Object.entries(labels.labels).length;
    const [openedCategories, setOpenedCategories] = useState(Array(amountCategories).fill(true));
    const [categoryHeights, setCategoryHeights] = useState(Array(amountCategories).fill('undefined'));
    useEffect(() => {
        setCategoryHeights(
            [...sidebar.current.getElementsByClassName('category')].map((category) => {
                return category.clientHeight;
            })
        );
    }, []);

    return (
        <>
            {
                Object.entries(labels.labels).map(([categoryName, content], index) => {
                    return (
                        <div className={'category' + (openedCategories[index] ? ' opened' : ' closed')} key={categoryName}>
                            <div className="header" onClick={() => {
                                let copiedCategories = [...openedCategories];
                                copiedCategories[index] = !copiedCategories[index];
                                setOpenedCategories(copiedCategories);
                            }}>
                                <a>{categoryName}</a>
                                <i className="fas fa-chevron-down" />
                            </div>
                            <div className="content" style={{ height: openedCategories[index] ? `${categoryHeights[index]}px` : '0px' }}>
                                {
                                    content.labels.map(({ id, name }) => {
                                        return (
                                            <div className="inspiration-label" key={id}>
                                                <Checkbox name={id} label={name} />
                                            </div>
                                        )
                                    })
                                }
                            </div>
                        </div>
                    )
                })
            }
        </>
    )
}