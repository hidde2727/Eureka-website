import { useRef, forwardRef, useImperativeHandle, useState, useEffect } from 'react';

import { Popover } from '../components/popover.jsx';
import Website from '../components/website.jsx';
import { useInspirationLabels } from '../utils/data_fetching.jsx';

export const InspirationPopover = forwardRef(({}, ref) => {
    const { labels, isFetching, hasError } = useInspirationLabels();
    const mappedLabels = useRef({});
    useEffect(() => {
        if(labels == undefined) return;
        labels.labels.forEach((category) => {
            category.labels.forEach((label) => {
                mappedLabels.current[label.id] = label.name;
            });
        });
    }, [labels]);

    const internalRef = useRef();
    useImperativeHandle(ref, () => ({
        open: (inspirationData) => {
            setData(inspirationData);
            internalRef.current.open();
        },
        close: () => {
            internalRef.current.close();
        }
    }));
    const [data, setData] = useState();
    if(data == undefined || labels == undefined || hasError) return <Popover ref={internalRef} id="inspiration-popover" />;

    return (
        <Popover ref={internalRef} id="inspiration-popover">
            <div className="split-window">
                <div className="center-content"><Website data={data.additionInfo} /></div>
                <div className="description">
                    <p>{data.description}</p>
                    <div className="labels">
                        {
                            (data.labels ?? '').split(',').map((labelID) => {
                                if(labelID == '') return;
                                return (
                                    <p className="label" key={labelID}>{mappedLabels.current[labelID]}</p>
                                )
                            })
                        }
                    </div>
                </div>
            </div>
            <p className="comparable">Vergelijkbaar:</p>
            <div className="split-window">
                <div className="center-content"><Website data={data.recommendation1} /></div>
                <div className="center-content"><Website data={data.recommendation2} /></div>
            </div>
        </Popover>
    );
});
export default InspirationPopover;