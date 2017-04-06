<?php
/**
 * BF2Statistics ASP Framework
 *
 * Author:       Steven Wilson
 * Copyright:    Copyright (c) 2006-2017, BF2statistics.com
 * License:      GNU GPL v3
 *
 */
use System\Controller;
use System\Response;
use System\View;

/**
 * Roundinfo Module Controller
 *
 * @package Modules
 */
class Roundinfo extends Controller
{
    /**
     * @var RoundInfoAjaxModel
     */
    protected $ajaxModel = null;

    /**
     * @var RoundInfoModel
     */
    protected $roundInfoModel;

    /**
     * @protocol    ANY
     * @request     /ASP/roundinfo
     * @output      html
     */
    public function index()
    {
        // Require database connection
        $this->requireDatabase();

        // Load view
        $view = new View('index', 'roundinfo');

        // Attach needed scripts for the form
        $view->attachScript("/ASP/frontend/js/datatables/jquery.dataTables.js");
        $view->attachScript("/ASP/frontend/modules/roundinfo/js/index.js");

        // Attach needed stylesheets
        $view->attachStylesheet("/ASP/frontend/modules/players/css/links.css");

        // Send output
        $view->render();
    }

    /**
     * @protocol    ANY
     * @request     /ASP/roundinfo/view/$id
     * @output      html
     *
     * @param int $id The round history ID
     */
    public function view($id = 0)
    {
        // Require a database connection
        $this->requireDatabase();

        // Ensure correct format for ID
        $id = (int)$id;
        if ($id == 0)
        {
            Response::Redirect('roundinfo');
            die;
        }

        // Attach model
        $this->loadModel('RoundInfoModel', 'roundinfo');

        // Fetch round
        $round = $this->roundInfoModel->fetchRoundInfoById($id);
        if (empty($round))
        {
            Response::Redirect('roundinfo');
            die;
        }

        // Attach round information to view
        $view = new View('view', 'roundinfo');
        $view->set('round', $round['round']);
        $view->set('players1', $round['players1']);
        $view->set('players2', $round['players2']);

        // Can we add advanced information?
        $result = $this->roundInfoModel->addAdvancedRoundInfo($round['round'], $view);
        $view->set('advanced', $result);

        // Alert user if we could not load the snapshot
        if (!$result)
            $view->displayMessage('warning', 'Unable to locate snapshot for this round. Some round details could not be displayed.');

        // Attach awards
        $this->roundInfoModel->attachAwards($id, $view);

        // Attach needed scripts for the form
        $view->attachScript("/ASP/frontend/js/datatables/jquery.dataTables.js");
        $view->attachScript("/ASP/frontend/modules/roundinfo/js/view.js");

        // Attach stylesheets
        $view->attachStylesheet("/ASP/frontend/css/icons/icol32.css");
        $view->attachStylesheet("/ASP/frontend/modules/roundinfo/css/view.css");

        // Send output
        $view->render();
    }

    /**
     * @protocol    POST
     * @request     /ASP/roundinfo/list
     * @output      json
     */
    public function postList()
    {
        // Require a database connection
        $this->requireDatabase(true);

        // Attach Model
        $this->loadModel('RoundInfoAjaxModel', 'roundinfo', 'ajaxModel');

        try
        {
            $data = $this->ajaxModel->getRoundList($_POST);
            echo json_encode($data);
        }
        catch (Exception $e)
        {
            // Log Exception
            Asp::LogException($e);

            // Send error message to client
            echo json_encode(['error' => $e->getMessage()]);
        }
    }
}