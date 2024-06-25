<style>

    #background {
        height: 100vh; 
        width: 100vw;
        
        background-image: linear-gradient(to bottom right, #3F4F75, #7283aa);
        overflow: hidden;

        position: relative;
    }

    #background .background-circle {
        display: block;
        position: absolute;

        top: 0px;
        left: 0px;

        width: min(20vmin, 150px);
        height: min(20vmin, 150px);
        border-radius: min(20vmin, 150px);

        box-shadow: -1000px 0px min(3vmin, 25px) currentColor;
    }

</style>
<script src="Background/background.js"></script> 